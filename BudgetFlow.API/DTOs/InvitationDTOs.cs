using BudgetFlow.API.Models;

namespace BudgetFlow.API.DTOs;

public record InvitationDto(
    int Id,
    int GroupId,
    string GroupName,
    int InviterId,
    string InviterName,
    string InviteeName,
    string InviteeEmail,
    InvitationStatus Status,
    DateTime CreatedAt
);
