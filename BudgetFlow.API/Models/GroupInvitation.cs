namespace BudgetFlow.API.Models;

public enum InvitationStatus { Pending, Accepted, Declined }

public class GroupInvitation
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public int InviterId { get; set; }
    public User Inviter { get; set; } = null!;
    public int InviteeId { get; set; }
    public User Invitee { get; set; } = null!;
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}
