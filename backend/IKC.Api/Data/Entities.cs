namespace IKC.Api.Data;

/// <summary>
/// Dokument sadržaja: jedna stranica (Kind = "page", Key = slug) ili postavke stranice (Kind = "settings", Key = "site").
/// Json ima oblik iz src/cms/types.ts (Page ili SiteSettings).
/// </summary>
public class SiteDocument
{
    public int Id { get; set; }
    public required string Kind { get; set; }
    public required string Key { get; set; }
    public required string Json { get; set; }
    public int SortOrder { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

/// <summary>Prethodna verzija dokumenta, da admin može vratiti izmjenu.</summary>
public class SiteDocumentRevision
{
    public int Id { get; set; }
    public required string Kind { get; set; }
    public required string Key { get; set; }
    public required string Json { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

/// <summary>Vaktija preuzeta sa vaktija.eu jednom dnevno (cijeli mjesec + datumi za taj dan).</summary>
public class PrayerFetch
{
    public int Id { get; set; }
    public required string City { get; set; }
    /// <summary>yyyy-MM-dd po berlinskom vremenu</summary>
    public required string Date { get; set; }
    public required string Json { get; set; }
    public DateTime FetchedAt { get; set; }
}

/// <summary>Online prijava za članstvo. Json ima oblik MembershipApplication iz src/cms/types.ts.</summary>
public class MembershipRequest
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Json { get; set; }
    /// <summary>"new" ili "done" (admin je obradio prijavu)</summary>
    public string Status { get; set; } = "new";
    public DateTime CreatedAt { get; set; }
    public string? HandledBy { get; set; }
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
