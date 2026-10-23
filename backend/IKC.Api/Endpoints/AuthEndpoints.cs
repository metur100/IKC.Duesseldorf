using System.Security.Claims;
using IKC.Api.Data;
using IKC.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Endpoints;

public static class AuthEndpoints
{
    private static readonly PasswordHasher<AdminUser> Hasher = new();

    public record LoginRequest(string Username, string Password);
    public record CreateUserRequest(string Username, string DisplayName, string Password);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, TokenService tokens) =>
        {
            var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Username == req.Username);
            if (user is null || Hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
                return Results.Unauthorized();

            var (token, expiresAt) = tokens.Create(user);
            return Results.Ok(new { token, expiresAt, user = new { user.Username, user.DisplayName } });
        }).RequireRateLimiting("login");

        var users = app.MapGroup("/api/admin/users").RequireAuthorization();

        users.MapGet("/", async (AppDbContext db) =>
            await db.AdminUsers.OrderBy(u => u.Username)
                .Select(u => new { u.Id, u.Username, u.DisplayName, u.CreatedAt })
                .ToListAsync());

        users.MapPost("/", async (CreateUserRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Username) || req.Password.Length < 10)
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["password"] = ["Lozinka mora imati najmanje 10 znakova."],
                });
            if (await db.AdminUsers.AnyAsync(u => u.Username == req.Username))
                return Results.Conflict(new { error = "Korisnik već postoji." });

            var user = new AdminUser { Username = req.Username.Trim(), DisplayName = req.DisplayName.Trim(), CreatedAt = DateTime.UtcNow };
            user.PasswordHash = Hasher.HashPassword(user, req.Password);
            db.AdminUsers.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/users/{user.Id}", new { user.Id, user.Username, user.DisplayName });
        });

        users.MapDelete("/{id:int}", async (int id, ClaimsPrincipal principal, AppDbContext db) =>
        {
            if (principal.FindFirstValue(ClaimTypes.NameIdentifier) == id.ToString())
                return Results.BadRequest(new { error = "Ne možete obrisati sami sebe." });

            var deleted = await db.AdminUsers.Where(u => u.Id == id).ExecuteDeleteAsync();
            return deleted == 0 ? Results.NotFound() : Results.NoContent();
        });

        users.MapPut("/me/password", async (ChangePasswordRequest req, ClaimsPrincipal principal, AppDbContext db) =>
        {
            var id = int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await db.AdminUsers.FindAsync(id);
            if (user is null) return Results.NotFound();
            if (Hasher.VerifyHashedPassword(user, user.PasswordHash, req.CurrentPassword) == PasswordVerificationResult.Failed)
                return Results.BadRequest(new { error = "Trenutna lozinka nije tačna." });
            if (req.NewPassword.Length < 10)
                return Results.BadRequest(new { error = "Lozinka mora imati najmanje 10 znakova." });

            user.PasswordHash = Hasher.HashPassword(user, req.NewPassword);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
