using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using IKC.Api.Data;
using IKC.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Endpoints;

public static class ContentEndpoints
{
    private static readonly string[] Languages = ["bs", "de"];

    public static void MapContentEndpoints(this WebApplication app)
    {
        // Javno: cijeli sadržaj, isti oblik kao src/i18n/content.json. Ovo čita GitHub Actions prije builda.
        app.MapGet("/api/content", async (AppDbContext db) =>
        {
            var sections = await db.ContentSections.AsNoTracking().ToListAsync();
            var result = new JsonObject();
            foreach (var lang in Languages)
                result[lang] = BuildLanguage(sections.Where(s => s.Lang == lang));
            return Results.Json(result);
        });

        app.MapGet("/api/content/{lang}", async (string lang, AppDbContext db) =>
        {
            if (!Languages.Contains(lang)) return Results.NotFound();
            var sections = await db.ContentSections.AsNoTracking().Where(s => s.Lang == lang).ToListAsync();
            return Results.Json(BuildLanguage(sections));
        });

        var admin = app.MapGroup("/api/admin/content").RequireAuthorization();

        // Lista sekcija za admin panel (bez sadržaja).
        admin.MapGet("/", async (AppDbContext db) =>
            await db.ContentSections.AsNoTracking()
                .OrderBy(s => s.Key).ThenBy(s => s.Lang)
                .Select(s => new { s.Lang, s.Key, s.UpdatedAt, s.UpdatedBy })
                .ToListAsync());

        admin.MapGet("/{lang}/{key}", async (string lang, string key, AppDbContext db) =>
        {
            var section = await db.ContentSections.AsNoTracking().SingleOrDefaultAsync(s => s.Lang == lang && s.Key == key);
            return section is null
                ? Results.NotFound()
                : Results.Json(new { section.Lang, section.Key, section.UpdatedAt, section.UpdatedBy, data = JsonNode.Parse(section.Json) });
        });

        admin.MapPut("/{lang}/{key}", async (string lang, string key, JsonElement body, ClaimsPrincipal user,
            AppDbContext db, SiteRebuildTrigger rebuild) =>
        {
            var section = await db.ContentSections.SingleOrDefaultAsync(s => s.Lang == lang && s.Key == key);
            if (section is null) return Results.NotFound();

            // Frontend očekuje tačno ovaj oblik (src/i18n/content.ts). Ne dozvoljavamo da izmjena
            // izbaci polje ili promijeni tip, jer bi to srušilo build stranice.
            using var current = JsonDocument.Parse(section.Json);
            var problem = CompareShape(current.RootElement, body, key);
            if (problem is not null)
                return Results.BadRequest(new { error = problem });

            section.Json = body.GetRawText();
            section.UpdatedAt = DateTime.UtcNow;
            section.UpdatedBy = user.Identity?.Name;
            await db.SaveChangesAsync();

            rebuild.Request();
            return Results.Ok(new { section.Lang, section.Key, section.UpdatedAt, section.UpdatedBy, rebuildScheduled = rebuild.IsConfigured });
        });

        // Ručno pokretanje objave (npr. dugme "Objavi sada" u admin panelu).
        admin.MapPost("/publish", (SiteRebuildTrigger rebuild) =>
        {
            if (!rebuild.IsConfigured) return Results.Problem("GitHub nije podešen na serveru.", statusCode: 503);
            rebuild.Request();
            return Results.Accepted();
        });
    }

    private static JsonObject BuildLanguage(IEnumerable<ContentSection> sections)
    {
        var obj = new JsonObject();
        foreach (var s in sections.OrderBy(s => s.Id))
            obj[s.Key] = JsonNode.Parse(s.Json);
        return obj;
    }

    /// <summary>Vraća opis greške ako novi JSON nema isti oblik kao postojeći; inače null.</summary>
    private static string? CompareShape(JsonElement expected, JsonElement actual, string path)
    {
        if (expected.ValueKind != actual.ValueKind)
            return $"'{path}' mora biti {expected.ValueKind}, a poslano je {actual.ValueKind}.";

        switch (expected.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var prop in expected.EnumerateObject())
                {
                    if (!actual.TryGetProperty(prop.Name, out var value))
                        return $"Nedostaje polje '{path}.{prop.Name}'.";
                    if (CompareShape(prop.Value, value, $"{path}.{prop.Name}") is { } error)
                        return error;
                }
                return null;

            case JsonValueKind.Array:
                // Lista smije imati više ili manje stavki, ali svaka mora imati oblik prve postojeće.
                if (expected.GetArrayLength() == 0) return null;
                var template = expected[0];
                var i = 0;
                foreach (var item in actual.EnumerateArray())
                {
                    if (CompareShape(template, item, $"{path}[{i++}]") is { } error)
                        return error;
                }
                return null;

            default:
                return null;
        }
    }
}
