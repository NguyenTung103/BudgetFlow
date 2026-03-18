using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Models;
using BudgetFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class InvitationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICacheService _cache;
    public InvitationsController(AppDbContext db, ICacheService cache) { _db = db; _cache = cache; }
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Lấy danh sách lời mời đang chờ của người dùng hiện tại</summary>
    [HttpGet]
    public async Task<ActionResult<List<InvitationDto>>> GetMyInvitations()
    {
        var userId = CurrentUserId;
        var invitations = await _db.GroupInvitations
            .Where(i => i.InviteeId == userId && i.Status == InvitationStatus.Pending)
            .Include(i => i.Group)
            .Include(i => i.Inviter)
            .Include(i => i.Invitee)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvitationDto(
                i.Id, i.GroupId, i.Group.Name,
                i.InviterId, i.Inviter.FullName,
                i.Invitee.FullName, i.Invitee.Email,
                i.Status, i.CreatedAt))
            .ToListAsync();
        return invitations;
    }

    /// <summary>Chấp thuận lời mời vào nhóm</summary>
    [HttpPost("{id}/accept")]
    public async Task<IActionResult> Accept(int id)
    {
        var userId = CurrentUserId;
        var invitation = await _db.GroupInvitations
            .Include(i => i.Group)
            .FirstOrDefaultAsync(i => i.Id == id && i.InviteeId == userId && i.Status == InvitationStatus.Pending);
        if (invitation == null) return NotFound(new { message = "Lời mời không tồn tại hoặc đã được xử lý" });

        // Check if already a member (race condition guard)
        if (await _db.GroupMembers.AnyAsync(gm => gm.GroupId == invitation.GroupId && gm.UserId == userId))
        {
            invitation.Status = InvitationStatus.Accepted;
            invitation.RespondedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Bạn đã là thành viên của nhóm này" });
        }

        invitation.Status = InvitationStatus.Accepted;
        invitation.RespondedAt = DateTime.UtcNow;
        _db.GroupMembers.Add(new GroupMember { GroupId = invitation.GroupId, UserId = userId, Role = GroupRole.Member });
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync($"groups:user:{userId}");
        await _cache.RemoveAsync($"groups:user:{invitation.InviterId}");
        return Ok(new { message = $"Đã tham gia nhóm \"{invitation.Group.Name}\" thành công!" });
    }

    /// <summary>Từ chối lời mời vào nhóm</summary>
    [HttpPost("{id}/decline")]
    public async Task<IActionResult> Decline(int id)
    {
        var userId = CurrentUserId;
        var invitation = await _db.GroupInvitations
            .FirstOrDefaultAsync(i => i.Id == id && i.InviteeId == userId && i.Status == InvitationStatus.Pending);
        if (invitation == null) return NotFound(new { message = "Lời mời không tồn tại hoặc đã được xử lý" });

        invitation.Status = InvitationStatus.Declined;
        invitation.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã từ chối lời mời" });
    }

    /// <summary>Xem lời mời mình đã gửi (Admin/Owner)</summary>
    [HttpGet("sent")]
    public async Task<ActionResult<List<InvitationDto>>> GetSentInvitations([FromQuery] int? groupId)
    {
        var userId = CurrentUserId;
        var query = _db.GroupInvitations
            .Where(i => i.InviterId == userId && i.Status == InvitationStatus.Pending)
            .Include(i => i.Group)
            .Include(i => i.Inviter)
            .Include(i => i.Invitee)
            .AsQueryable();
        if (groupId.HasValue) query = query.Where(i => i.GroupId == groupId);
        var result = await query.OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvitationDto(
                i.Id, i.GroupId, i.Group.Name,
                i.InviterId, i.Inviter.FullName,
                i.Invitee.FullName, i.Invitee.Email,
                i.Status, i.CreatedAt))
            .ToListAsync();
        return result;
    }
}
