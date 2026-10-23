namespace IKC.Api.Data;

/// <summary>
/// Jedna sekcija sadržaja na jednom jeziku, npr. ("bs", "home") ili ("de", "faq").
/// Json ima isti oblik kao odgovarajući ključ u src/i18n/content.json na frontendu.
/// </summary>
public class ContentSection
{
    public int Id { get; set; }
    public required string Lang { get; set; }
    public required string Key { get; set; }
    public required string Json { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

/// <summary>Slika uploadovana na ImgBB. Čuvamo linkove da ih admin panel može ponovo ponuditi.</summary>
public class Image
{
    public int Id { get; set; }
    public required string ImgBbId { get; set; }
    public required string Url { get; set; }
    public required string DisplayUrl { get; set; }
    public string? ThumbUrl { get; set; }
    /// <summary>ImgBB nema API za brisanje; ovo je link na kojem se slika ručno briše.</summary>
    public string? DeleteUrl { get; set; }
    public string? Title { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UploadedBy { get; set; }
}

public class AdminUser
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string DisplayName { get; set; }
    public string PasswordHash { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
