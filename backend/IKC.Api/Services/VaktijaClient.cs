using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using IKC.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace IKC.Api.Services;

public record PrayerDay(int Day, string Fajr, string Sunrise, string Dhuhr, string Asr, string Maghrib, string Isha);

public record LocalizedText(string Bs, string De);

/// <summary>Odgovor GET /api/vaktija/{city}. Oblik: VaktijaResponse u src/cms/types.ts.</summary>
public record VaktijaResponse(
    string Location,
    string Date,
    LocalizedText Gregorian,
    LocalizedText Hijri,
    PrayerDay Today,
    PrayerDay? Tomorrow,
    string MonthStart,
    IReadOnlyList<PrayerDay> Month,
    DateTime FetchedAt,
    bool Stale);

/// <summary>Ono što čuvamo u bazi za jedan dan (PrayerFetch.Json).</summary>
internal record StoredVaktija(string Location, LocalizedText Gregorian, LocalizedText Hijri, string MonthStart, List<PrayerDay> Month);

/// <summary>
/// Vremena namaza sa vaktija.eu (vaktija koju koriste džemati IGBD u Njemačkoj).
///
/// vaktija.eu nema javni API, pa čitamo JSON koji njihova Next.js stranica koristi:
/// /_next/data/{buildId}/{locale}/{city}.json. buildId se mijenja sa svakim njihovim deployem,
/// zato ga čitamo iz HTML-a i keširamo, a na 404 ga ponovo učitamo.
///
/// Preuzimamo jednom dnevno (prvi zahtjev tog dana po berlinskom vremenu) i čuvamo u bazi.
/// Odgovor sadrži cijeli mjesec, pa ako vaktija.eu padne, vremena za danas uzimamo iz zadnjeg sačuvanog mjeseca.
/// </summary>
public partial class VaktijaClient(HttpClient http, IMemoryCache cache, AppDbContext db, ILogger<VaktijaClient> logger)
{
    private const string BaseUrl = "https://vaktija.eu";
    private static readonly TimeZoneInfo Berlin = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");
    private static readonly SemaphoreSlim FetchLock = new(1, 1);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [GeneratedRegex("\"buildId\":\"([^\"]+)\"")]
    private static partial Regex BuildIdRegex();

    public async Task<VaktijaResponse> GetTodayAsync(string city, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Berlin));
        var date = today.ToString("yyyy-MM-dd");
        var cacheKey = $"vaktija:{city}:{date}";
        if (cache.TryGetValue(cacheKey, out VaktijaResponse? cached) && cached is not null)
            return cached;

        var fetch = await db.PrayerFetches.AsNoTracking().SingleOrDefaultAsync(p => p.City == city && p.Date == date, ct);
        if (fetch is null)
        {
            await FetchLock.WaitAsync(ct);
            try
            {
                fetch = await db.PrayerFetches.AsNoTracking().SingleOrDefaultAsync(p => p.City == city && p.Date == date, ct)
                        ?? await DownloadAndStoreAsync(city, date, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
            {
                logger.LogWarning(ex, "vaktija.eu nije dostupna za {City}", city);
                var fallback = await FallbackAsync(city, today, ct);
                if (fallback is null) throw;
                // Ponovo pokušaj preuzimanja za 30 minuta.
                cache.Set(cacheKey, fallback, TimeSpan.FromMinutes(30));
                return fallback;
            }
            finally
            {
                FetchLock.Release();
            }
        }

        var stored = JsonSerializer.Deserialize<StoredVaktija>(fetch.Json, Json)!;
        var result = Build(stored, today, fetch.FetchedAt, stale: false)
                     ?? throw new InvalidOperationException("vaktija.eu: nema današnjeg dana u mjesecu");
        var midnight = TimeZoneInfo.ConvertTimeToUtc(today.AddDays(1).ToDateTime(TimeOnly.MinValue), Berlin);
        cache.Set(cacheKey, result, new DateTimeOffset(midnight, TimeSpan.Zero));
        return result;
    }

    private async Task<PrayerFetch> DownloadAndStoreAsync(string city, string date, CancellationToken ct)
    {
        var bs = await FetchPagePropsAsync(city, "bs", ct);
        var de = await FetchPagePropsAsync(city, "de", ct);

        var month = bs["monthDays"]?.AsArray().Select(d => ReadDay(d!)).ToList()
                    ?? throw new InvalidOperationException("vaktija.eu: nema monthDays");
        var stored = new StoredVaktija(
            Location: (string?)bs["locationRes"]?["name"] ?? "Düsseldorf",
            Gregorian: new((string?)bs["todayGregorian"] ?? "", (string?)de["todayGregorian"] ?? ""),
            Hijri: new((string?)bs["todayHijri"] ?? "", (string?)de["todayHijri"] ?? ""),
            MonthStart: (string?)bs["monthStart"] ?? date[..8] + "01",
            Month: month);

        var fetch = new PrayerFetch { City = city, Date = date, Json = JsonSerializer.Serialize(stored, Json), FetchedAt = DateTime.UtcNow };
        db.PrayerFetches.Add(fetch);

        // Stari dani ne trebaju; dva mjeseca su dovoljna rezerva.
        var cutoff = DateOnly.ParseExact(date, "yyyy-MM-dd").AddDays(-60).ToString("yyyy-MM-dd");
        await db.PrayerFetches.Where(p => p.City == city && string.Compare(p.Date, cutoff) < 0).ExecuteDeleteAsync(ct);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Vaktija preuzeta sa vaktija.eu za {City} {Date}", city, date);
        return fetch;
    }

    /// <summary>Rezerva: današnja vremena iz zadnjeg sačuvanog mjeseca.</summary>
    private async Task<VaktijaResponse?> FallbackAsync(string city, DateOnly today, CancellationToken ct)
    {
        var monthStart = new DateOnly(today.Year, today.Month, 1).ToString("yyyy-MM-dd");
        var candidates = await db.PrayerFetches.AsNoTracking()
            .Where(p => p.City == city).OrderByDescending(p => p.Date).Take(40).ToListAsync(ct);
        foreach (var fetch in candidates)
        {
            var stored = JsonSerializer.Deserialize<StoredVaktija>(fetch.Json, Json)!;
            if (stored.MonthStart != monthStart) continue;
            var dated = stored with
            {
                Gregorian = new(today.ToString("d. MMMM yyyy", CultureInfo.GetCultureInfo("bs-Latn-BA")),
                                today.ToString("d. MMMM yyyy", CultureInfo.GetCultureInfo("de-DE"))),
                Hijri = new("", ""),
            };
            return Build(dated, today, fetch.FetchedAt, stale: true);
        }
        return null;
    }

    private static VaktijaResponse? Build(StoredVaktija s, DateOnly today, DateTime fetchedAt, bool stale)
    {
        var day = s.Month.FirstOrDefault(d => d.Day == today.Day);
        if (day is null) return null;
        return new VaktijaResponse(
            Location: s.Location,
            Date: today.ToString("yyyy-MM-dd"),
            Gregorian: s.Gregorian,
            Hijri: s.Hijri,
            Today: day,
            Tomorrow: s.Month.FirstOrDefault(d => d.Day == today.Day + 1),
            MonthStart: s.MonthStart,
            Month: s.Month,
            FetchedAt: fetchedAt,
            Stale: stale);
    }

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

    private static PrayerDay ReadDay(JsonNode node) => new(
        Day: (int?)node["day"] ?? 0,
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
