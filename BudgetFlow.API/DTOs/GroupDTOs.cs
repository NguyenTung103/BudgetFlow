using System.ComponentModel.DataAnnotations;
using BudgetFlow.API.Models;

namespace BudgetFlow.API.DTOs;

public record CreateGroupRequest(
    [Required] string Name,
    string? Description
);

public record UpdateGroupRequest(string? Name, string? Description);

public record GroupDto(
    int Id,
    string Name,
    string? Description,
    int OwnerId,
    string OwnerName,
    DateTime CreatedAt,
    List<GroupMemberDto> Members
);

public record GroupMemberDto(
    int UserId,
    string FullName,
    string Email,
    string? AvatarUrl,
    GroupRole Role,
    DateTime JoinedAt
);

public record AddMemberRequest([Required, EmailAddress] string Email);
