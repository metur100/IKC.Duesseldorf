using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<SiteDocument> SiteDocuments => Set<SiteDocument>();
    public DbSet<SiteDocumentRevision> SiteDocumentRevisions => Set<SiteDocumentRevision>();
    public DbSet<PrayerFetch> PrayerFetches => Set<PrayerFetch>();
    public DbSet<MembershipRequest> MembershipRequests => Set<MembershipRequest>();
    public DbSet<Image> Images => Set<Image>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Tabele koje su dodane poslije prvog EnsureCreated prave se u DbSeeder.EnsureTablesAsync,
        // pa nazivi i kolone ovdje moraju odgovarati tom SQL-u.
        modelBuilder.Entity<SiteDocument>(e =>
        {
            e.ToTable("SiteDocuments");
            e.Property(x => x.Kind).HasMaxLength(20);
            e.Property(x => x.Key).HasMaxLength(100);
            e.Property(x => x.UpdatedBy).HasMaxLength(100);
            e.HasIndex(x => new { x.Kind, x.Key }).IsUnique();
        });

        modelBuilder.Entity<SiteDocumentRevision>(e =>
        {
            e.ToTable("SiteDocumentRevisions");
            e.Property(x => x.Kind).HasMaxLength(20);
            e.Property(x => x.Key).HasMaxLength(100);
            e.Property(x => x.CreatedBy).HasMaxLength(100);
            e.HasIndex(x => new { x.Kind, x.Key });
        });

        modelBuilder.Entity<PrayerFetch>(e =>
        {
            e.ToTable("PrayerFetches");
            e.Property(x => x.City).HasMaxLength(50);
            e.Property(x => x.Date).HasMaxLength(10);
            e.HasIndex(x => new { x.City, x.Date }).IsUnique();
        });

        modelBuilder.Entity<MembershipRequest>(e =>
        {
            e.ToTable("MembershipRequests");
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(10);
            e.Property(x => x.HandledBy).HasMaxLength(100);
        });

        modelBuilder.Entity<Image>(e =>
        {
            e.Property(x => x.ImgBbId).HasMaxLength(50);
            e.Property(x => x.Title).HasMaxLength(200);
        });

        modelBuilder.Entity<AdminUser>(e =>
        {
            e.Property(x => x.Username).HasMaxLength(50);
            e.Property(x => x.DisplayName).HasMaxLength(100);
            e.HasIndex(x => x.Username).IsUnique();
        });
    }
}
