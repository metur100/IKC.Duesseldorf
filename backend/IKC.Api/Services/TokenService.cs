using System.Security.Claims;
using System.Text;
using IKC.Api.Data;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace IKC.Api.Services;

public class JwtOptions
{
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public int ExpiresHours { get; set; } = 12;
}

public class TokenService(IOptions<JwtOptions> options)
{
    public (string Token, DateTime ExpiresAt) Create(AdminUser user)
    {
        var o = options.Value;
        var expiresAt = DateTime.UtcNow.AddHours(o.ExpiresHours);

        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = o.Issuer,
            Audience = o.Audience,
            Expires = expiresAt,
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("display_name", user.DisplayName),
            ]),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(o.Key)), SecurityAlgorithms.HmacSha256),
        });

        return (token, expiresAt);
    }
}
