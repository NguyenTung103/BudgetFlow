using BudgetFlow.API.Data;
using BudgetFlow.API.Hubs;
using BudgetFlow.API.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BudgetFlow.API.Services;

public class BudgetAlertService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SyncHub> _hub;

    public BudgetAlertService(AppDbContext db, IHubContext<SyncHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task CheckAndNotifyBudgetAsync(int groupId, int categoryId, int month, int year)
    {
        var budget = await _db.Budgets
            .Include(b => b.Category)
            .FirstOrDefaultAsync(b => b.GroupId == groupId && b.CategoryId == categoryId
                                   && b.Month == month && b.Year == year);
        if (budget == null) return;

        var spent = await _db.Expenses
            .Where(e => e.GroupId == groupId && e.CategoryId == categoryId
                       && e.Date.Month == month && e.Date.Year == year)
            .SumAsync(e => e.Amount);

        var percentage = budget.LimitAmount > 0 ? (spent / budget.LimitAmount) * 100 : 0;
        string? message = null;
        string? type = null;

        if (percentage >= 100)
        {
            message = $"⚠️ Ngân sách '{budget.Category.Name}' đã vượt {percentage:F0}%! ({spent:N0}đ / {budget.LimitAmount:N0}đ)";
            type = "danger";
        }
        else if (percentage >= 80)
        {
            message = $"🔔 Ngân sách '{budget.Category.Name}' đã dùng {percentage:F0}% ({spent:N0}đ / {budget.LimitAmount:N0}đ)";
            type = "warning";
        }

        if (message != null)
        {
            var members = await _db.GroupMembers
                .Where(gm => gm.GroupId == groupId).Select(gm => gm.UserId).ToListAsync();
            foreach (var userId in members)
                _db.Notifications.Add(new Notification { Message = message, Type = type!, UserId = userId, GroupId = groupId });
            await _db.SaveChangesAsync();
            await _hub.Clients.Group($"group_{groupId}").SendAsync("BudgetAlert", new
            {
                GroupId = groupId, CategoryId = categoryId, Message = message,
                Type = type, Percentage = percentage, Spent = spent, Limit = budget.LimitAmount
            });
        }
    }
}
