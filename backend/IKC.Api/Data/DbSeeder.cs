using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Data;

public static class DbSeeder
{
    /// <summary>
    /// Kreira bazu ako ne postoji, puni sadržaj iz content.json (samo kad je tabela prazna)
    /// i pravi prvog admina iz konfiguracije (samo kad nema nijednog korisnika).
    /// </summary>
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DbSeeder));

        await db.Database.EnsureCreatedAsync();

        if (!await db.ContentSections.AnyAsync())
        {
            var seedPath = Path.Combine(AppContext.BaseDirectory, "Seed", "content.json");
            if (File.Exists(seedPath))
            {
                using var doc = JsonDocument.Parse(await File.ReadAllTextAsync(seedPath));
                foreach (var lang in doc.RootElement.EnumerateObject())
                foreach (var section in lang.Value.EnumerateObject())
                {
                    db.ContentSections.Add(new ContentSection
                    {
                        Lang = lang.Name,
                        Key = section.Name,
                        Json = section.Value.GetRawText(),
                        UpdatedAt = DateTime.UtcNow,
                        UpdatedBy = "seed",
                    });
                }
                await db.SaveChangesAsync();
                logger.LogInformation("Sadržaj učitan iz {Path}", seedPath);
            }
            else
            {
                logger.LogWarning("Baza je prazna, a {Path} ne postoji", seedPath);
            }
        }

        var username = config["Admin:Username"];
        var password = config["Admin:Password"];
        if (!await db.AdminUsers.AnyAsync() && !string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            var user = new AdminUser { Username = username, DisplayName = username, CreatedAt = DateTime.UtcNow };
            user.PasswordHash = new PasswordHasher<AdminUser>().HashPassword(user, password);
            db.AdminUsers.Add(user);
            await db.SaveChangesAsync();
            logger.LogInformation("Kreiran prvi admin: {Username}", username);
        }
    }
}
