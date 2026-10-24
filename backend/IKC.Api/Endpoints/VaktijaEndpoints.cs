using IKC.Api.Services;

namespace IKC.Api.Endpoints;

public static class VaktijaEndpoints
{
    public static void MapVaktijaEndpoints(this WebApplication app)
    {
        // GET /api/vaktija/dusseldorf: danas, sutra i cijeli mjesec (oblik: VaktijaResponse u src/cms/types.ts)
        app.MapGet("/api/vaktija/dusseldorf", async (VaktijaClient vaktija, HttpContext http, CancellationToken ct) =>
        {
            try
            {
                var result = await vaktija.GetTodayAsync("dusseldorf", ct);
                http.Response.Headers.CacheControl = "public, max-age=600";
                return Results.Ok(result);
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
            {
                return Results.Problem("vaktija.eu trenutno nije dostupna.", statusCode: StatusCodes.Status502BadGateway);
            }
        });
    }
}
