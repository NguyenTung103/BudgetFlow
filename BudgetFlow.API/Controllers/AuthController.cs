using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Models;
using BudgetFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BudgetFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt) { _db = db; _jwt = jwt; }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { message = "Email đã được sử dụng" });

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var group = new Group { Name = $"Nhóm của {user.FullName}", OwnerId = user.Id };
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();

        _db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = user.Id, Role = GroupRole.Owner });
        await _db.SaveChangesAsync();

        return await GenerateAuthResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng" });
        if (!user.IsActive)
            return Unauthorized(new { message = "Tài khoản đã bị khóa" });
        return await GenerateAuthResponse(user);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request)
    {
        var refreshToken = await _db.RefreshTokens.Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && !rt.IsRevoked);
        if (refreshToken == null || refreshToken.ExpiresAt < DateTime.UtcNow)
            return Unauthorized(new { message = "Refresh token không hợp lệ" });
        refreshToken.IsRevoked = true;
        await _db.SaveChangesAsync();
        return await GenerateAuthResponse(refreshToken.User);
    }

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var tokens = await _db.RefreshTokens.Where(rt => rt.UserId == userId && !rt.IsRevoked).ToListAsync();
        foreach (var token in tokens) token.IsRevoked = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đăng xuất thành công" });
    }

    [Authorize, HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();
        return new UserDto(user.Id, user.FullName, user.Email, user.AvatarUrl, user.CreatedAt);
    }

    [Authorize, HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();
        if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
        if (!string.IsNullOrEmpty(request.AvatarUrl)) user.AvatarUrl = request.AvatarUrl;
        if (!string.IsNullOrEmpty(request.CurrentPassword) && !string.IsNullOrEmpty(request.NewPassword))
        {
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Mật khẩu hiện tại không đúng" });
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }
        await _db.SaveChangesAsync();
        return new UserDto(user.Id, user.FullName, user.Email, user.AvatarUrl, user.CreatedAt);
    }

    private async Task<AuthResponse> GenerateAuthResponse(User user)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        var refreshTokenStr = _jwt.GenerateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken { Token = refreshTokenStr, UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddDays(30) });
        await _db.SaveChangesAsync();
        return new AuthResponse(accessToken, refreshTokenStr,
            new UserDto(user.Id, user.FullName, user.Email, user.AvatarUrl, user.CreatedAt));
    }
}
