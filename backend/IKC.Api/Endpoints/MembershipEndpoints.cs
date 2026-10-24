using System.Net.Mail;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using IKC.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Endpoints;

/// <summary>Online prijave za članstvo: javni obrazac (web i aplikacija) i pregled u admin panelu.</summary>
public static class MembershipEndpoints
{
    private static readonly Dictionary<string, decimal> MinAmount = new()
    {
        ["monthly"] = 20, ["halfyear"] = 120, ["yearly"] = 240, // Pravilnik o članarini, § 3
    };

    public static void MapMembershipEndpoints(this WebApplication app)
    {
        app.MapPost("/api/membership", async (JsonElement body, AppDbContext db) =>
        {
            if (body.ValueKind != JsonValueKind.Object || body.GetRawText().Length > 20_000)
                return Results.BadRequest(new { error = "Neispravan zahtjev." });

            string Text(string name) =>
                body.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()!.Trim() : "";
            bool Flag(string name) => body.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.True;

            var firstName = Text("firstName");
            var lastName = Text("lastName");
            var email = Text("email");
            var payMethod = Text("payMethod");
            var interval = Text("interval");
            var de = Text("lang") == "de";
            string Error(string bs, string german) => de ? german : bs;

            if (firstName.Length == 0 || lastName.Length == 0)
                return Results.BadRequest(new { error = Error("Ime i prezime su obavezni.", "Vor- und Nachname sind Pflichtfelder.") });
            if (!MailAddress.TryCreate(email, out _))
                return Results.BadRequest(new { error = Error("E-mail adresa nije ispravna.", "Die E-Mail-Adresse ist ungültig.") });
            if (!Flag("consentData"))
                return Results.BadRequest(new { error = Error("Potrebna je saglasnost za obradu podataka.", "Die Einwilligung zur Datenverarbeitung ist erforderlich.") });
            if (!MinAmount.TryGetValue(interval, out var min)
                || !body.TryGetProperty("amount", out var amountEl) || !amountEl.TryGetDecimal(out var amount) || amount < min)
                return Results.BadRequest(new { error = Error($"Najmanja članarina za odabrani period je {min} €.", $"Der Mindestbeitrag für diesen Zeitraum beträgt {min} €.") });
            if (payMethod == "sepa" && (Text("iban").Length < 15 || !Flag("consentSepa")))
                return Results.BadRequest(new { error = Error("Za SEPA su potrebni IBAN i SEPA saglasnost.", "Für SEPA werden IBAN und SEPA-Mandat benötigt.") });

            var name = $"{firstName} {lastName}";
            db.MembershipRequests.Add(new MembershipRequest
            {
                Name = name.Length > 200 ? name[..200] : name,
                Email = email.Length > 200 ? email[..200] : email,
                Json = body.GetRawText(),
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
            return Results.Ok(new { ok = true });
        }).RequireRateLimiting("forms");

        var admin = app.MapGroup("/api/admin/membership").RequireAuthorization();

        admin.MapGet("/", async (AppDbContext db) =>
        {
            var rows = await db.MembershipRequests.AsNoTracking().OrderByDescending(r => r.Id).ToListAsync();
            return rows.Select(r => new
            {
                r.Id, r.Name, r.Email, r.Status, r.CreatedAt, r.HandledBy,
                data = JsonNode.Parse(r.Json),
            });
        });

        admin.MapPut("/{id:int}/status", async (int id, JsonElement body, ClaimsPrincipal user, AppDbContext db) =>
        {
            var status = body.TryGetProperty("status", out var s) ? s.GetString() : null;
            if (status is not ("new" or "done")) return Results.BadRequest(new { error = "Status mora biti 'new' ili 'done'." });
            var row = await db.MembershipRequests.FindAsync(id);
            if (row is null) return Results.NotFound();
            row.Status = status;
            row.HandledBy = status == "done" ? user.Identity?.Name : null;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        admin.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var deleted = await db.MembershipRequests.Where(r => r.Id == id).ExecuteDeleteAsync();
            return deleted == 0 ? Results.NotFound() : Results.NoContent();
        });
    }
}
