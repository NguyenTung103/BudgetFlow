using System.Security.Claims;
using BudgetFlow.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BudgetFlow.API.Hubs;

[Authorize]
public class SyncHub : Hub
{
    private readonly AppDbContext _db;
    public SyncHub(AppDbContext db) => _db = db;

    public override async Task OnConnectedAsync()
    {
        var userId = int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var groupIds = await _db.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Select(gm => gm.GroupId)
            .ToListAsync();
        foreach (var groupId in groupIds)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");
        await base.OnConnectedAsync();
    }

    public async Task JoinGroup(int groupId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");

    public async Task LeaveGroup(int groupId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group_{groupId}");
}
