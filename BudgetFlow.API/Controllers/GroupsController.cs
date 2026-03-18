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
public class GroupsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICacheService _cache;
    public GroupsController(AppDbContext db, ICacheService cache) { _db = db; _cache = cache; }
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetMyGroups()
    {
        var userId = CurrentUserId;
        var cacheKey = $"groups:user:{userId}";
        var cached = await _cache.GetAsync<List<GroupDto>>(cacheKey);
        if (cached is not null) return cached;

        var groups = await _db.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Include(gm => gm.Group).ThenInclude(g => g.Owner)
            .Include(gm => gm.Group).ThenInclude(g => g.Members).ThenInclude(m => m.User)
            .Select(gm => gm.Group).ToListAsync();
        var result = groups.Select(MapToDto).ToList();
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(2));
        return result;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GroupDto>> GetGroup(int id)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == userId)) return Forbid();
        var group = await _db.Groups.Include(g => g.Owner)
            .Include(g => g.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (group == null) return NotFound();
        return MapToDto(group);
    }

    [HttpPost]
    public async Task<ActionResult<GroupDto>> CreateGroup(CreateGroupRequest request)
    {
        var userId = CurrentUserId;
        var group = new Group { Name = request.Name, Description = request.Description, OwnerId = userId };
        _db.Groups.Add(group);
        await _db.SaveChangesAsync();
        _db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = userId, Role = GroupRole.Owner });
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync($"groups:user:{userId}");
        return await GetGroupFull(group.Id);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GroupDto>> UpdateGroup(int id, UpdateGroupRequest request)
    {
        var userId = CurrentUserId;
        var member = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == userId);
        if (member == null || member.Role == GroupRole.Member) return Forbid();
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (request.Name != null) group.Name = request.Name;
        if (request.Description != null) group.Description = request.Description;
        await _db.SaveChangesAsync();
        await _cache.RemoveByPatternAsync($"groups:user:");
        return await GetGroupFull(id);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var userId = CurrentUserId;
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        if (group.OwnerId != userId) return Forbid();
        _db.Groups.Remove(group);
        await _db.SaveChangesAsync();
        await _cache.RemoveByPatternAsync($"groups:user:");
        return NoContent();
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(int id, AddMemberRequest request)
    {
        var userId = CurrentUserId;
        var isAdmin = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == userId
            && (gm.Role == GroupRole.Admin || gm.Role == GroupRole.Owner));
        if (!isAdmin) return Forbid();
        var group = await _db.Groups.FindAsync(id);
        if (group == null) return NotFound();
        var userToAdd = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (userToAdd == null) return NotFound(new { message = "Không tìm thấy người dùng với email này" });
        if (await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == userToAdd.Id))
            return BadRequest(new { message = "Người dùng đã là thành viên của nhóm" });
        // Check for existing pending invitation
        if (await _db.GroupInvitations.AnyAsync(i => i.GroupId == id && i.InviteeId == userToAdd.Id && i.Status == InvitationStatus.Pending))
            return BadRequest(new { message = "Đã gửi lời mời cho người dùng này, đang chờ chấp thuận" });
        var invitation = new GroupInvitation { GroupId = id, InviterId = userId, InviteeId = userToAdd.Id };
        _db.GroupInvitations.Add(invitation);
        await _db.SaveChangesAsync();
        return Ok(new { message = $"Đã gửi lời mời tới {userToAdd.Email}, chờ người dùng chấp thuận" });
    }

    [HttpDelete("{id}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int id, int memberId)
    {
        var userId = CurrentUserId;
        var requester = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == userId);
        if (requester == null || (requester.Role == GroupRole.Member && memberId != userId)) return Forbid();
        var member = await _db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == id && gm.UserId == memberId);
        if (member == null) return NotFound();
        if (member.Role == GroupRole.Owner) return BadRequest(new { message = "Không thể xóa chủ nhóm" });
        _db.GroupMembers.Remove(member);
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync($"groups:user:{userId}");
        await _cache.RemoveAsync($"groups:user:{memberId}");
        return NoContent();
    }

    private GroupDto MapToDto(Group g) => new(g.Id, g.Name, g.Description, g.OwnerId, g.Owner.FullName, g.CreatedAt,
        g.Members.Select(m => new GroupMemberDto(m.UserId, m.User.FullName, m.User.Email, m.User.AvatarUrl, m.Role, m.JoinedAt)).ToList());

    private async Task<GroupDto> GetGroupFull(int groupId)
    {
        var group = await _db.Groups.Include(g => g.Owner).Include(g => g.Members).ThenInclude(m => m.User).FirstAsync(g => g.Id == groupId);
        return MapToDto(group);
    }
}
