using System.Net.Http.Headers;
using System.Threading.Channels;
using Microsoft.Extensions.Options;

namespace IKC.Api.Services;

public class GitHubOptions
{
    /// <summary>npr. "metur100/IKC.Duesseldorf"</summary>
    public string Repository { get; set; } = "";
    /// <summary>Fine-grained token samo za taj repo, dozvola "Contents: read and write".</summary>
    public string Token { get; set; } = "";
    /// <summary>Koliko čekati poslije zadnje izmjene prije builda, da više izmjena ide u jedan deploy.</summary>
    public int DebounceSeconds { get; set; } = 60;
}

/// <summary>
/// Poslije izmjene sadržaja pokreće GitHub Actions (repository_dispatch "content-updated"),
/// koji preuzme sadržaj sa API-ja, napravi statičnu stranicu i objavi je na GitHub Pages.
/// </summary>
public class SiteRebuildTrigger(IHttpClientFactory httpFactory, IOptions<GitHubOptions> options, ILogger<SiteRebuildTrigger> logger)
    : BackgroundService
{
    public const string HttpClientName = "github";

    private readonly Channel<bool> _requests = Channel.CreateBounded<bool>(
        new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite });

    public bool IsConfigured => !string.IsNullOrWhiteSpace(options.Value.Repository) && !string.IsNullOrWhiteSpace(options.Value.Token);

    public void Request() => _requests.Writer.TryWrite(true);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (await _requests.Reader.WaitToReadAsync(stoppingToken))
        {
            await Task.Delay(TimeSpan.FromSeconds(options.Value.DebounceSeconds), stoppingToken);
            while (_requests.Reader.TryRead(out _)) { }

            if (!IsConfigured)
            {
                logger.LogInformation("GitHub nije podešen; stranica se neće automatski ponovo objaviti.");
                continue;
            }

            try
            {
                await DispatchAsync(stoppingToken);
                logger.LogInformation("Pokrenut build stranice na GitHubu.");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Pokretanje builda na GitHubu nije uspjelo.");
            }
        }
    }

    private async Task DispatchAsync(CancellationToken ct)
    {
        var http = httpFactory.CreateClient(HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.github.com/repos/{options.Value.Repository}/dispatches")
        {
            Content = JsonContent.Create(new { event_type = "content-updated" }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.Value.Token);
        request.Headers.Accept.ParseAdd("application/vnd.github+json");
        request.Headers.UserAgent.ParseAdd("IKC-Duesseldorf-Api");
        request.Headers.Add("X-GitHub-Api-Version", "2022-11-28");

        using var response = await http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }
}
