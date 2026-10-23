using IKC.Api.Services;

namespace IKC.Api.Endpoints;

public static class VaktijaEndpoints
{
    public static void MapVaktijaEndpoints(this WebApplication app)
    {
        // GET /api/vaktija/dusseldorf?lang=bs|de
        app.MapGet("/api/vaktija/dusseldorf", async (string? lang, VaktijaClient vaktija, HttpContext http, CancellationToken ct) =>
        {
            var locale = lang == "de" ? "de" : "bs";
            try
            {
                var result = await vaktija.GetTodayAsync("dusseldorf", locale, ct);
                http.Response.Headers.CacheControl = "public, max-age=300";
                return Results.Ok(result);
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
            {
                return Results.Problem("vaktija.eu trenutno nije dostupna.", statusCode: StatusCodes.Status502BadGateway);
            }
        });
    }
}
