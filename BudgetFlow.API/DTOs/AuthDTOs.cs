using System.ComponentModel.DataAnnotations;

namespace BudgetFlow.API.DTOs;

public record RegisterRequest(
    [Required] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserDto User
);

public record RefreshTokenRequest([Required] string RefreshToken);

public record UserDto(
    int Id,
    string FullName,
    string Email,
    string? AvatarUrl,
    DateTime CreatedAt
);

public record UpdateProfileRequest(
    string? FullName,
    string? AvatarUrl,
    string? CurrentPassword,
    string? NewPassword
);
