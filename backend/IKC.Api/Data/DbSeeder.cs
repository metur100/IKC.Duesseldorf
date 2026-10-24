using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Data;

public static class DbSeeder
{
    /// <summary>
    /// Kreira bazu ako ne postoji, dodaje nove tabele u postojeću bazu, puni sadržaj iz site.json
    /// (samo kad nema nijednog dokumenta) i pravi prvog admina iz konfiguracije (samo kad nema nijednog korisnika).
    /// </summary>
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DbSeeder));

        await db.Database.EnsureCreatedAsync();
        await EnsureTablesAsync(db);

        if (!await db.SiteDocuments.AnyAsync())
        {
            var seedPath = Path.Combine(AppContext.BaseDirectory, "Seed", "site.json");
            if (File.Exists(seedPath))
            {
                using var doc = JsonDocument.Parse(await File.ReadAllTextAsync(seedPath));
                var now = DateTime.UtcNow;
                db.SiteDocuments.Add(new SiteDocument
                {
                    Kind = "settings", Key = "site", Json = doc.RootElement.GetProperty("settings").GetRawText(),
                    UpdatedAt = now, UpdatedBy = "seed",
                });
                var order = 0;
                foreach (var page in doc.RootElement.GetProperty("pages").EnumerateArray())
                {
                    db.SiteDocuments.Add(new SiteDocument
                    {
                        Kind = "page", Key = page.GetProperty("slug").GetString()!, Json = page.GetRawText(),
                        SortOrder = order++, UpdatedAt = now, UpdatedBy = "seed",
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

    /// <summary>
    /// EnsureCreated ne dodaje tabele u bazu koja već postoji, pa tabele uvedene kasnije pravimo ovdje.
    /// Mora odgovarati mapiranju u AppDbContext.
    /// </summary>
    private static async Task EnsureTablesAsync(AppDbContext db)
    {
        string[] statements = db.Database.IsSqlServer()
            ?
            [
                """
                IF OBJECT_ID(N'SiteDocuments') IS NULL
                CREATE TABLE SiteDocuments (
                    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    Kind nvarchar(20) NOT NULL, [Key] nvarchar(100) NOT NULL, Json nvarchar(max) NOT NULL,
                    SortOrder int NOT NULL, UpdatedAt datetime2 NOT NULL, UpdatedBy nvarchar(100) NULL)
                """,
                "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SiteDocuments_Kind_Key') CREATE UNIQUE INDEX IX_SiteDocuments_Kind_Key ON SiteDocuments (Kind, [Key])",
                """
                IF OBJECT_ID(N'SiteDocumentRevisions') IS NULL
                CREATE TABLE SiteDocumentRevisions (
                    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    Kind nvarchar(20) NOT NULL, [Key] nvarchar(100) NOT NULL, Json nvarchar(max) NOT NULL,
                    CreatedAt datetime2 NOT NULL, CreatedBy nvarchar(100) NULL)
                """,
                "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SiteDocumentRevisions_Kind_Key') CREATE INDEX IX_SiteDocumentRevisions_Kind_Key ON SiteDocumentRevisions (Kind, [Key])",
                """
                IF OBJECT_ID(N'PrayerFetches') IS NULL
                CREATE TABLE PrayerFetches (
                    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    City nvarchar(50) NOT NULL, Date nvarchar(10) NOT NULL, Json nvarchar(max) NOT NULL, FetchedAt datetime2 NOT NULL)
                """,
                "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PrayerFetches_City_Date') CREATE UNIQUE INDEX IX_PrayerFetches_City_Date ON PrayerFetches (City, Date)",
                """
                IF OBJECT_ID(N'MembershipRequests') IS NULL
                CREATE TABLE MembershipRequests (
                    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    Name nvarchar(200) NOT NULL, Email nvarchar(200) NOT NULL, Json nvarchar(max) NOT NULL,
                    Status nvarchar(10) NOT NULL, CreatedAt datetime2 NOT NULL, HandledBy nvarchar(100) NULL)
                """,
            ]
            :
            [
                """
                CREATE TABLE IF NOT EXISTS SiteDocuments (
                    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    Kind TEXT NOT NULL, "Key" TEXT NOT NULL, Json TEXT NOT NULL,
                    SortOrder INTEGER NOT NULL, UpdatedAt TEXT NOT NULL, UpdatedBy TEXT NULL)
                """,
                "CREATE UNIQUE INDEX IF NOT EXISTS IX_SiteDocuments_Kind_Key ON SiteDocuments (Kind, \"Key\")",
                """
                CREATE TABLE IF NOT EXISTS SiteDocumentRevisions (
                    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    Kind TEXT NOT NULL, "Key" TEXT NOT NULL, Json TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL, CreatedBy TEXT NULL)
                """,
                "CREATE INDEX IF NOT EXISTS IX_SiteDocumentRevisions_Kind_Key ON SiteDocumentRevisions (Kind, \"Key\")",
                """
                CREATE TABLE IF NOT EXISTS PrayerFetches (
                    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    City TEXT NOT NULL, Date TEXT NOT NULL, Json TEXT NOT NULL, FetchedAt TEXT NOT NULL)
                """,
                "CREATE UNIQUE INDEX IF NOT EXISTS IX_PrayerFetches_City_Date ON PrayerFetches (City, Date)",
                """
                CREATE TABLE IF NOT EXISTS MembershipRequests (
                    Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT NULL, Email TEXT NOT NULL, Json TEXT NOT NULL,
                    Status TEXT NOT NULL, CreatedAt TEXT NOT NULL, HandledBy TEXT NULL)
                """,
            ];

        foreach (var sql in statements)
            await db.Database.ExecuteSqlRawAsync(sql);
    }
}
