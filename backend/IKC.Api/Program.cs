using System.Text;
using System.Threading.RateLimiting;
using IKC.Api.Data;
using IKC.Api.Endpoints;
using IKC.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// Bez Windows Event Loga: na dijeljenom IIS hostingu nema dozvolu pisanja i ruši zahtjeve.
builder.Logging.ClearProviders().AddConsole().AddDebug();

// Lokalno: SQLite fajl. Na MonsterASP: Database:Provider = SqlServer + njihov connection string.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = config.GetConnectionString("Default");
    if (string.Equals(config["Database:Provider"], "SqlServer", StringComparison.OrdinalIgnoreCase))
        options.UseSqlServer(connectionString);
    else
        options.UseSqlite(connectionString);
});

builder.Services.Configure<JwtOptions>(config.GetSection("Jwt"));
builder.Services.Configure<ImgBbOptions>(config.GetSection("ImgBb"));
builder.Services.Configure<GitHubOptions>(config.GetSection("GitHub"));

builder.Services.AddSingleton<TokenService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<ImgBbClient>(c => c.Timeout = TimeSpan.FromSeconds(60));
builder.Services.AddHttpClient<VaktijaClient>(c =>
{
    c.Timeout = TimeSpan.FromSeconds(15);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("IKC-Duesseldorf/1.0 (+https://ikc-d.org)");
});
builder.Services.AddHttpClient(SiteRebuildTrigger.HttpClientName);
builder.Services.AddSingleton<SiteRebuildTrigger>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<SiteRebuildTrigger>());

var jwtKey = config["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key mora biti postavljen i imati najmanje 32 znaka.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = config["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(config.GetSection("Cors:Origins").Get<string[]>() ?? [])
        .AllowAnyHeader()
        .AllowAnyMethod()));

// Zaštita od pogađanja lozinke: 5 pokušaja prijave po minuti po IP adresi.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
    // Javni obrasci (prijava za članstvo): zaštita od spama.
    options.AddPolicy("forms", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
});

var app = builder.Build();

await DbSeeder.SeedAsync(app.Services, config);

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new { name = "IKC Düsseldorf API", status = "ok" }));
app.MapAuthEndpoints();
app.MapContentEndpoints();
app.MapImageEndpoints();
app.MapVaktijaEndpoints();
app.MapMembershipEndpoints();

app.Run();
