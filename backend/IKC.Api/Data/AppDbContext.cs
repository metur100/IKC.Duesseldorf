using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ContentSection> ContentSections => Set<ContentSection>();
    public DbSet<Image> Images => Set<Image>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContentSection>(e =>
        {
            e.Property(x => x.Lang).HasMaxLength(2);
            e.Property(x => x.Key).HasMaxLength(50);
            e.HasIndex(x => new { x.Lang, x.Key }).IsUnique();
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
