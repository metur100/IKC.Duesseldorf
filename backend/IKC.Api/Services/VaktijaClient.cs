using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;

namespace IKC.Api.Services;

public record PrayerTimes(string Fajr, string Sunrise, string Dhuhr, string Asr, string Maghrib, string Isha);

public record DailyVaktija(
    string Source,
    string Location,
    string Date,
    string Gregorian,
    string? Hijri,
    PrayerTimes Times,
    bool Stale);

/// <summary>
/// Vremena namaza sa vaktija.eu (vaktija koju koriste džemati IGBD u Njemačkoj).
///
/// vaktija.eu nema javni API, pa čitamo JSON koji njihova Next.js stranica koristi:
/// /_next/data/{buildId}/{locale}/{city}.json. buildId se mijenja sa svakim njihovim deployem,
/// zato ga čitamo iz HTML-a i keširamo, a na 404 ga ponovo učitamo.
/// Odgovor sadrži i cijeli mjesec (monthDays), pa ako vaktija.eu padne, vremena za danas
/// uzimamo iz zadnjeg uspješno preuzetog mjeseca.
/// </summary>
public partial class VaktijaClient(HttpClient http, IMemoryCache cache, ILogger<VaktijaClient> logger)
{
    private const string BaseUrl = "https://vaktija.eu";
    private static readonly TimeZoneInfo Berlin = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");

    [GeneratedRegex("\"buildId\":\"([^\"]+)\"")]
    private static partial Regex BuildIdRegex();

    public async Task<DailyVaktija> GetTodayAsync(string city, string locale, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Berlin));
        var dailyKey = $"vaktija:{city}:{locale}:{today:yyyy-MM-dd}";
        if (cache.TryGetValue(dailyKey, out DailyVaktija? cached) && cached is not null)
            return cached;

        try
        {
            var pageProps = await FetchPagePropsAsync(city, locale, ct);
            var result = Map(pageProps, today);

            // Do ponoći po berlinskom vremenu; poslije toga vaktija.eu daje novi dan.
            var midnight = TimeZoneInfo.ConvertTimeToUtc(today.AddDays(1).ToDateTime(TimeOnly.MinValue), Berlin);
            cache.Set(dailyKey, result, new DateTimeOffset(midnight, TimeSpan.Zero));
            cache.Set(MonthKey(city, today), pageProps, TimeSpan.FromDays(40));
            return result;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            logger.LogWarning(ex, "vaktija.eu nije dostupna za {City}/{Locale}", city, locale);

            if (cache.TryGetValue(MonthKey(city, today), out JsonNode? month) && month is not null
                && FromMonth(month, today) is { } fallback)
                return fallback;

            throw;
        }
    }

    private static string MonthKey(string city, DateOnly day) => $"vaktija-month:{city}:{day:yyyy-MM}";

    private async Task<JsonNode> FetchPagePropsAsync(string city, string locale, CancellationToken ct)
    {
        var buildId = await GetBuildIdAsync(city, refresh: false, ct);
        var response = await http.GetAsync($"{BaseUrl}/_next/data/{buildId}/{locale}/{city}.json", ct);

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            // Novi deploy na vaktija.eu: stari buildId više ne važi.
            buildId = await GetBuildIdAsync(city, refresh: true, ct);
            response = await http.GetAsync($"{BaseUrl}/_next/data/{buildId}/{locale}/{city}.json", ct);
        }

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonNode>(ct);
        return json?["pageProps"] ?? throw new InvalidOperationException("vaktija.eu: nema pageProps u odgovoru");
    }

    private async Task<string> GetBuildIdAsync(string city, bool refresh, CancellationToken ct)
    {
        const string key = "vaktija:buildId";
        if (!refresh && cache.TryGetValue(key, out string? buildId) && buildId is not null)
            return buildId;

        var html = await http.GetStringAsync($"{BaseUrl}/{city}", ct);
        var match = BuildIdRegex().Match(html);
        if (!match.Success)
            throw new InvalidOperationException("vaktija.eu: buildId nije pronađen");

        buildId = match.Groups[1].Value;
        cache.Set(key, buildId, TimeSpan.FromHours(6));
        return buildId;
    }

    private static DailyVaktija Map(JsonNode pageProps, DateOnly today)
    {
        var daily = pageProps["dailyPrayersRes"] ?? throw new InvalidOperationException("vaktija.eu: nema dailyPrayersRes");
        return new DailyVaktija(
            Source: "vaktija.eu",
            Location: (string?)pageProps["locationRes"]?["name"] ?? "Düsseldorf",
            Date: today.ToString("yyyy-MM-dd"),
            Gregorian: (string?)pageProps["todayGregorian"] ?? today.ToString("dd.MM.yyyy"),
            Hijri: (string?)pageProps["todayHijri"],
            Times: ReadTimes(daily),
            Stale: false);
    }

    /// <summary>Rezerva: vremena za danas iz keširanog mjesečnog pregleda.</summary>
    private static DailyVaktija? FromMonth(JsonNode pageProps, DateOnly today)
    {
        var day = pageProps["monthDays"]?.AsArray().FirstOrDefault(d => (int?)d?["day"] == today.Day);
        if (day is null) return null;

        return new DailyVaktija(
            Source: "vaktija.eu",
            Location: (string?)pageProps["locationRes"]?["name"] ?? "Düsseldorf",
            Date: today.ToString("yyyy-MM-dd"),
            Gregorian: today.ToString("dd.MM.yyyy"),
            Hijri: null,
            Times: ReadTimes(day),
            Stale: true);
    }

    private static PrayerTimes ReadTimes(JsonNode node) => new(
        Fajr: HourMinute(node["fajr"]),
        Sunrise: HourMinute(node["sunrise"]),
        Dhuhr: HourMinute(node["dhuhr"]),
        Asr: HourMinute(node["asr"]),
        Maghrib: HourMinute(node["maghrib"]),
        Isha: HourMinute(node["isha"]));

    // "06:18:00" -> "06:18"
    private static string HourMinute(JsonNode? value)
    {
        var text = (string?)value ?? throw new InvalidOperationException("vaktija.eu: nedostaje vrijeme namaza");
        return text.Length >= 5 ? text[..5] : text;
    }
}
