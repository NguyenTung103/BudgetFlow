using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class GroupsController : ControllerBase
{
    private readonly AppDbContext _db;
    public GroupsController(AppDbContext db) => _db = db;
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<GroupDto>>> GetMyGroups()
    {
        var userId = CurrentUserId;
        var groups = await _db.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Include(gm => gm.Group).ThenInclude(g => g.Owner)
            .Include(gm => gm.Group).ThenInclude(g => g.Members).ThenInclude(m => m.User)
            .Select(gm => gm.Group).ToListAsync();
        return groups.Select(MapToDto).ToList();
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
        return NoContent();
    }

    [HttpPost("{id}/members")]
    public async Task<ActionResult<GroupMemberDto>> AddMember(int id, AddMemberRequest request)
    {
        var userId = CurrentUserId;
        var isAdmin = await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == userId
            && (gm.Role == GroupRole.Admin || gm.Role == GroupRole.Owner));
        if (!isAdmin) return Forbid();
        var userToAdd = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (userToAdd == null) return NotFound(new { message = "Không tìm thấy người dùng với email này" });
        if (await _db.GroupMembers.AnyAsync(gm => gm.GroupId == id && gm.UserId == userToAdd.Id))
            return BadRequest(new { message = "Người dùng đã là thành viên của nhóm" });
        var member = new GroupMember { GroupId = id, UserId = userToAdd.Id, Role = GroupRole.Member };
        _db.GroupMembers.Add(member);
        await _db.SaveChangesAsync();
        return new GroupMemberDto(userToAdd.Id, userToAdd.FullName, userToAdd.Email, userToAdd.AvatarUrl, GroupRole.Member, member.JoinedAt);
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
