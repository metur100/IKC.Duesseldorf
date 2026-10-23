using System.Security.Claims;
using IKC.Api.Data;
using IKC.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace IKC.Api.Endpoints;

public static class ImageEndpoints
{
    private const long MaxBytes = 32 * 1024 * 1024; // ImgBB limit
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public static void MapImageEndpoints(this WebApplication app)
    {
        var images = app.MapGroup("/api/admin/images").RequireAuthorization();

        images.MapGet("/", async (AppDbContext db) =>
            await db.Images.AsNoTracking().OrderByDescending(i => i.CreatedAt).ToListAsync());

        // multipart/form-data: file (obavezno), title (opcionalno)
        images.MapPost("/", async (IFormFile file, [Microsoft.AspNetCore.Mvc.FromForm] string? title, ClaimsPrincipal user,
            AppDbContext db, ImgBbClient imgBb, CancellationToken ct) =>
        {
            if (file.Length == 0 || file.Length > MaxBytes)
                return Results.BadRequest(new { error = "Slika mora biti manja od 32 MB." });
            if (!AllowedTypes.Contains(file.ContentType))
                return Results.BadRequest(new { error = "Dozvoljeni formati: JPG, PNG, WEBP, GIF." });

            ImgBbImage uploaded;
            try
            {
                await using var stream = file.OpenReadStream();
                uploaded = await imgBb.UploadAsync(stream, file.FileName, file.ContentType, title, ct);
            }
            catch (ImgBbException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
            }

            var image = new Image
            {
                ImgBbId = uploaded.Id,
                Url = uploaded.Url,
                DisplayUrl = uploaded.DisplayUrl,
                ThumbUrl = uploaded.Thumb?.Url,
                DeleteUrl = uploaded.DeleteUrl,
                Title = title,
                Width = uploaded.Width,
                Height = uploaded.Height,
                Size = uploaded.Size,
                CreatedAt = DateTime.UtcNow,
                UploadedBy = user.Identity?.Name,
            };
            db.Images.Add(image);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/admin/images/{image.Id}", image);
        }).DisableAntiforgery(); // JWT u headeru, bez cookija, pa CSRF nije problem

        // Briše samo zapis kod nas. Sama slika na ImgBB ostaje dok se ne otvori DeleteUrl.
        images.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var image = await db.Images.FindAsync(id);
            if (image is null) return Results.NotFound();
            db.Images.Remove(image);
            await db.SaveChangesAsync();
            return Results.Ok(new { image.DeleteUrl });
        });
    }
}
