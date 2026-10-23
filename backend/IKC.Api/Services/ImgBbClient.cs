using System.Net.Http.Headers;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace IKC.Api.Services;

public class ImgBbOptions
{
    /// <summary>Nikad u appsettings.json u gitu: user-secrets lokalno, varijabla okruženja na serveru.</summary>
    public string ApiKey { get; set; } = "";
}

/// <summary>Upload slika na ImgBB (https://api.imgbb.com/). Ključ ostaje na serveru, browser ga nikad ne vidi.</summary>
public class ImgBbClient(HttpClient http, IOptions<ImgBbOptions> options)
{
    public async Task<ImgBbImage> UploadAsync(Stream file, string fileName, string contentType, string? name, CancellationToken ct)
    {
        var apiKey = options.Value.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("ImgBb:ApiKey nije postavljen.");

        using var form = new MultipartFormDataContent();
        var fileContent = new StreamContent(file);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(fileContent, "image", fileName);
        if (!string.IsNullOrWhiteSpace(name))
            form.Add(new StringContent(name), "name");

        using var response = await http.PostAsync($"https://api.imgbb.com/1/upload?key={Uri.EscapeDataString(apiKey)}", form, ct);
        var body = await response.Content.ReadFromJsonAsync<ImgBbResponse>(ct);
        if (!response.IsSuccessStatusCode || body?.Data is null)
            throw new ImgBbException($"ImgBB upload nije uspio ({(int)response.StatusCode}): {body?.Error?.Message}");

        return body.Data;
    }

    private record ImgBbResponse(ImgBbImage? Data, bool Success, ImgBbError? Error);
    private record ImgBbError(string? Message);
}

public record ImgBbImage(
    string Id,
    string Url,
    [property: JsonPropertyName("display_url")] string DisplayUrl,
    [property: JsonPropertyName("delete_url")] string? DeleteUrl,
    ImgBbThumb? Thumb,
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] int Width,
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] int Height,
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] long Size);

public record ImgBbThumb(string Url);

public class ImgBbException(string message) : Exception(message);
