using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using IKC.Api.Data;
using IKC.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Endpoints;

/// <summary>
/// Sadržaj stranice (CMS): stranice sa blokovima i postavke (navigacija, kontakt, footer).
/// Oblik JSON-a je u src/cms/types.ts (Page, SiteSettings); backend ga čuva kako jeste i provjerava samo osnovno.
/// </summary>
public static partial class ContentEndpoints
{
    private const string PageKind = "page";
    private const string SettingsKind = "settings";
    private const string SettingsKey = "site";
    private const int MaxRevisions = 30;
    private const int MaxJsonLength = 2_000_000;

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugRegex();

    public record OrderRequest(string[] Slugs);

    public static void MapContentEndpoints(this WebApplication app)
    {
        // Javno: postavke i sve objavljene stranice. Čitaju ga web stranica, aplikacija i GitHub Actions prije builda.
        app.MapGet("/api/site", async (AppDbContext db, HttpContext http) =>
        {
            http.Response.Headers.CacheControl = "public, max-age=30";
            return Results.Json(await LoadSiteAsync(db, includeDrafts: false));
        });

        var admin = app.MapGroup("/api/admin").RequireAuthorization();

        // Sve, uključujući nacrte.
        admin.MapGet("/site", async (AppDbContext db) => Results.Json(await LoadSiteAsync(db, includeDrafts: true)));

        admin.MapPut("/settings", async (JsonElement body, string? baseVersion, ClaimsPrincipal user, AppDbContext db, SiteRebuildTrigger rebuild) =>
        {
            if (body.ValueKind != JsonValueKind.Object || !body.TryGetProperty("nav", out var nav) || nav.ValueKind != JsonValueKind.Array)
                return Results.BadRequest(new { error = "Postavke nisu ispravne." });

            var doc = await db.SiteDocuments.SingleOrDefaultAsync(d => d.Kind == SettingsKind && d.Key == SettingsKey);
            if (doc is null)
            {
                doc = new SiteDocument { Kind = SettingsKind, Key = SettingsKey, Json = "{}" };
                db.SiteDocuments.Add(doc);
            }
            else if (IsConflict(doc, baseVersion))
            {
                return Conflict(doc);
            }

            Save(db, doc, body.GetRawText(), user);
            await db.SaveChangesAsync();
            rebuild.Request();
            return Results.Ok(Version(doc));
        });

        admin.MapPost("/pages", async (JsonElement body, ClaimsPrincipal user, AppDbContext db, SiteRebuildTrigger rebuild) =>
        {
            if (ValidatePage(body) is { } error) return Results.BadRequest(new { error });
            var slug = body.GetProperty("slug").GetString()!;
            if (await db.SiteDocuments.AnyAsync(d => d.Kind == PageKind && d.Key == slug))
                return Results.Conflict(new { error = $"Stranica sa adresom '/{slug}' već postoji." });

            var maxOrder = await db.SiteDocuments.Where(d => d.Kind == PageKind).MaxAsync(d => (int?)d.SortOrder) ?? 0;
            var doc = new SiteDocument { Kind = PageKind, Key = slug, Json = "{}", SortOrder = maxOrder + 1 };
            db.SiteDocuments.Add(doc);
            Save(db, doc, body.GetRawText(), user, keepRevision: false);
            await db.SaveChangesAsync();
            rebuild.Request();
            return Results.Ok(Version(doc));
        });

        // Ako se slug u tijelu razlikuje od onog u adresi, stranica se preimenuje (i linkovi u navigaciji se ažuriraju).
        admin.MapPut("/pages/{slug}", async (string slug, JsonElement body, string? baseVersion, ClaimsPrincipal user,
            AppDbContext db, SiteRebuildTrigger rebuild) =>
        {
            if (ValidatePage(body) is { } error) return Results.BadRequest(new { error });
            var doc = await db.SiteDocuments.SingleOrDefaultAsync(d => d.Kind == PageKind && d.Key == slug);
            if (doc is null) return Results.NotFound();
            if (IsConflict(doc, baseVersion)) return Conflict(doc);

            var newSlug = body.GetProperty("slug").GetString()!;
            if (newSlug != slug)
            {
                if (slug == "home") return Results.BadRequest(new { error = "Adresa početne stranice se ne može mijenjati." });
                if (await db.SiteDocuments.AnyAsync(d => d.Kind == PageKind && d.Key == newSlug))
                    return Results.Conflict(new { error = $"Stranica sa adresom '/{newSlug}' već postoji." });
                await RenamePageReferencesAsync(db, slug, newSlug, user);
                await db.SiteDocumentRevisions.Where(r => r.Kind == PageKind && r.Key == slug)
                    .ExecuteUpdateAsync(s => s.SetProperty(r => r.Key, newSlug));
                doc.Key = newSlug;
            }

            Save(db, doc, body.GetRawText(), user);
            await db.SaveChangesAsync();
            rebuild.Request();
            return Results.Ok(Version(doc));
        });

        admin.MapDelete("/pages/{slug}", async (string slug, ClaimsPrincipal user, AppDbContext db, SiteRebuildTrigger rebuild) =>
        {
            if (slug == "home") return Results.BadRequest(new { error = "Početna stranica se ne može obrisati." });
            var doc = await db.SiteDocuments.SingleOrDefaultAsync(d => d.Kind == PageKind && d.Key == slug);
            if (doc is null) return Results.NotFound();

            // Zadnja verzija ostaje u revizijama, pa se obrisana stranica može vratiti.
            AddRevision(db, doc, user);
            db.SiteDocuments.Remove(doc);
            await db.SaveChangesAsync();
            rebuild.Request();
            return Results.NoContent();
        });

        admin.MapPut("/pages-order", async (OrderRequest req, AppDbContext db, SiteRebuildTrigger rebuild) =>
        {
            var docs = await db.SiteDocuments.Where(d => d.Kind == PageKind).ToListAsync();
            for (var i = 0; i < req.Slugs.Length; i++)
                if (docs.FirstOrDefault(d => d.Key == req.Slugs[i]) is { } doc)
                    doc.SortOrder = i;
            await db.SaveChangesAsync();
            rebuild.Request();
            return Results.NoContent();
        });

        // Historija izmjena: lista (bez sadržaja) i jedna verzija sa sadržajem.
        admin.MapGet("/revisions/{kind}/{key}", async (string kind, string key, AppDbContext db) =>
            await db.SiteDocumentRevisions.AsNoTracking()
                .Where(r => r.Kind == kind && r.Key == key)
                .OrderByDescending(r => r.Id)
                .Select(r => new { r.Id, r.CreatedAt, r.CreatedBy })
                .ToListAsync());

        admin.MapGet("/revisions/{id:int}", async (int id, AppDbContext db) =>
            await db.SiteDocumentRevisions.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id) is { } r
                ? Results.Json(new { r.Id, r.Kind, r.Key, r.CreatedAt, r.CreatedBy, data = JsonNode.Parse(r.Json) })
                : Results.NotFound());

        // Obrisane stranice (zadnja revizija stranice koja više ne postoji), da se mogu vratiti.
        admin.MapGet("/deleted-pages", async (AppDbContext db) =>
        {
            var existing = await db.SiteDocuments.Where(d => d.Kind == PageKind).Select(d => d.Key).ToListAsync();
            var revisions = await db.SiteDocumentRevisions.AsNoTracking()
                .Where(r => r.Kind == PageKind && !existing.Contains(r.Key))
                .Select(r => new { r.Id, r.Key, r.CreatedAt, r.CreatedBy })
                .ToListAsync();
            return revisions.GroupBy(r => r.Key).Select(g => g.MaxBy(r => r.Id)!).OrderByDescending(r => r.CreatedAt);
        });

        // Ručno pokretanje objave statične stranice (za Google); sadržaj je na stranici vidljiv i bez toga.
        admin.MapPost("/publish", (SiteRebuildTrigger rebuild) =>
        {
            if (!rebuild.IsConfigured) return Results.Problem("GitHub nije podešen na serveru.", statusCode: 503);
            rebuild.Request();
            return Results.Accepted();
        });
    }

    private static async Task<JsonObject> LoadSiteAsync(AppDbContext db, bool includeDrafts)
    {
        var docs = await db.SiteDocuments.AsNoTracking().OrderBy(d => d.SortOrder).ThenBy(d => d.Id).ToListAsync();
        var settings = docs.FirstOrDefault(d => d.Kind == SettingsKind && d.Key == SettingsKey);

        var pages = new JsonArray();
        foreach (var doc in docs.Where(d => d.Kind == PageKind))
        {
            if (JsonNode.Parse(doc.Json) is not JsonObject page) continue;
            if (!includeDrafts && page["draft"]?.GetValue<bool>() == true) continue;
            page["slug"] = doc.Key;
            page["updatedAt"] = Version(doc);
            page["updatedBy"] = doc.UpdatedBy;
            pages.Add(page);
        }

        var result = new JsonObject
        {
            ["settings"] = settings is null ? new JsonObject() : JsonNode.Parse(settings.Json),
            ["pages"] = pages,
        };
        if (includeDrafts && settings is not null)
            result["settingsVersion"] = Version(settings);
        return result;
    }

    private static string? ValidatePage(JsonElement body)
    {
        if (body.ValueKind != JsonValueKind.Object) return "Stranica mora biti JSON objekat.";
        if (body.GetRawText().Length > MaxJsonLength) return "Stranica je prevelika.";
        if (!body.TryGetProperty("slug", out var slug) || slug.ValueKind != JsonValueKind.String || !SlugRegex().IsMatch(slug.GetString()!))
            return "Adresa stranice smije imati samo mala slova, brojeve i crtice (npr. 'nasa-historija').";
        if (!body.TryGetProperty("title", out var title) || title.ValueKind != JsonValueKind.Object)
            return "Nedostaje naslov stranice.";
        if (!body.TryGetProperty("blocks", out var blocks) || blocks.ValueKind != JsonValueKind.Array)
            return "Nedostaju blokovi stranice.";
        foreach (var block in blocks.EnumerateArray())
            if (block.ValueKind != JsonValueKind.Object || !block.TryGetProperty("type", out _) || !block.TryGetProperty("id", out _))
                return "Svaki blok mora imati 'id' i 'type'.";
        return null;
    }

    /// <summary>Verzija = vrijeme zadnje izmjene. Klijent je šalje nazad da ne bi pregazio tuđu noviju izmjenu.</summary>
    private static string Version(SiteDocument doc) => DateTime.SpecifyKind(doc.UpdatedAt, DateTimeKind.Utc).ToString("O");

    private static bool IsConflict(SiteDocument doc, string? baseVersion) =>
        !string.IsNullOrEmpty(baseVersion) && baseVersion != Version(doc);

    private static IResult Conflict(SiteDocument doc) => Results.Conflict(new
    {
        error = $"Ovo je u međuvremenu promijenio {doc.UpdatedBy ?? "drugi admin"}. Osvježite i ponovo unesite izmjene.",
        updatedBy = doc.UpdatedBy,
        updatedAt = Version(doc),
    });

    private static void Save(AppDbContext db, SiteDocument doc, string json, ClaimsPrincipal user, bool keepRevision = true)
    {
        if (keepRevision && doc.Id != 0 && doc.Json != json)
            AddRevision(db, doc, user);

        // updatedAt/updatedBy računa server, ne čuvamo ih u JSON-u.
        var node = JsonNode.Parse(json)!.AsObject();
        node.Remove("updatedAt");
        node.Remove("updatedBy");
        doc.Json = node.ToJsonString();
        // Zaokruženo na milisekunde, da se verzija poklapa i poslije čitanja iz baze.
        var now = DateTime.UtcNow;
        doc.UpdatedAt = new DateTime(now.Ticks - now.Ticks % TimeSpan.TicksPerMillisecond, DateTimeKind.Utc);
        doc.UpdatedBy = user.Identity?.Name;
    }

    private static void AddRevision(AppDbContext db, SiteDocument doc, ClaimsPrincipal user)
    {
        db.SiteDocumentRevisions.Add(new SiteDocumentRevision
        {
            Kind = doc.Kind,
            Key = doc.Key,
            Json = doc.Json,
            CreatedAt = doc.UpdatedAt,
            CreatedBy = doc.UpdatedBy,
        });

        // Čuvamo samo zadnjih MaxRevisions verzija po dokumentu.
        var old = db.SiteDocumentRevisions.Where(r => r.Kind == doc.Kind && r.Key == doc.Key)
            .OrderByDescending(r => r.Id).Skip(MaxRevisions - 1).Select(r => r.Id).ToList();
        if (old.Count > 0)
            db.SiteDocumentRevisions.RemoveRange(db.SiteDocumentRevisions.Where(r => old.Contains(r.Id)));
    }

    /// <summary>Kad se stranica preimenuje, linkovi na nju u navigaciji i footeru pokazuju na novu adresu.</summary>
    private static async Task RenamePageReferencesAsync(AppDbContext db, string oldSlug, string newSlug, ClaimsPrincipal user)
    {
        var settings = await db.SiteDocuments.SingleOrDefaultAsync(d => d.Kind == SettingsKind && d.Key == SettingsKey);
        if (settings is null || JsonNode.Parse(settings.Json) is not JsonObject root) return;

        var changed = false;
        void Walk(JsonNode? node)
        {
            switch (node)
            {
                case JsonObject obj:
                    if (obj["page"] is JsonValue v && v.TryGetValue<string>(out var page) && page == oldSlug)
                    {
                        obj["page"] = newSlug;
                        changed = true;
                    }
                    foreach (var (_, child) in obj.ToList()) Walk(child);
                    break;
                case JsonArray arr:
                    foreach (var child in arr) Walk(child);
                    break;
            }
        }
        Walk(root["nav"]);
        Walk(root["footerLinks"]);
        if (changed) Save(db, settings, root.ToJsonString(), user);
    }
}
