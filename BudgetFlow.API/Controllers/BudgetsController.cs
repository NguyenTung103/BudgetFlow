using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Hubs;
using BudgetFlow.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SyncHub> _hub;
    public BudgetsController(AppDbContext db, IHubContext<SyncHub> hub) { _db = db; _hub = hub; }
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<BudgetDto>>> GetBudgets([FromQuery] int groupId, [FromQuery] int month, [FromQuery] int year)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId)) return Forbid();
        var budgets = await _db.Budgets.Include(b => b.Category)
            .Where(b => b.GroupId == groupId && b.Month == month && b.Year == year).ToListAsync();
        var result = new List<BudgetDto>();
        foreach (var budget in budgets)
        {
            var spent = await _db.Expenses.Where(e => e.GroupId == groupId && e.CategoryId == budget.CategoryId
                && e.Date.Month == month && e.Date.Year == year).SumAsync(e => e.Amount);
            var pct = budget.LimitAmount > 0 ? (spent / budget.LimitAmount) * 100 : 0;
            result.Add(new BudgetDto(budget.Id, budget.LimitAmount, spent, pct,
                budget.CategoryId, budget.Category.Name, budget.Category.Icon, budget.Category.Color,
                budget.GroupId, budget.Month, budget.Year));
        }
        return result;
    }

    [HttpPost]
    public async Task<ActionResult<BudgetDto>> CreateBudget(CreateBudgetRequest request)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == userId)) return Forbid();
        if (await _db.Budgets.AnyAsync(b => b.GroupId == request.GroupId && b.CategoryId == request.CategoryId && b.Month == request.Month && b.Year == request.Year))
            return BadRequest(new { message = "Ngân sách cho danh mục này đã tồn tại trong tháng" });
        var budget = new Budget { LimitAmount = request.LimitAmount, CategoryId = request.CategoryId, GroupId = request.GroupId, Month = request.Month, Year = request.Year };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        await _db.Entry(budget).Reference(b => b.Category).LoadAsync();
        var spent = await _db.Expenses.Where(e => e.GroupId == request.GroupId && e.CategoryId == request.CategoryId && e.Date.Month == request.Month && e.Date.Year == request.Year).SumAsync(e => e.Amount);
        var pct = budget.LimitAmount > 0 ? (spent / budget.LimitAmount) * 100 : 0;
        var dto = new BudgetDto(budget.Id, budget.LimitAmount, spent, pct, budget.CategoryId, budget.Category.Name, budget.Category.Icon, budget.Category.Color, budget.GroupId, budget.Month, budget.Year);
        await _hub.Clients.Group($"group_{request.GroupId}").SendAsync("BudgetCreated", dto);
        return CreatedAtAction(nameof(GetBudgets), new { groupId = request.GroupId, month = request.Month, year = request.Year }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BudgetDto>> UpdateBudget(int id, UpdateBudgetRequest request)
    {
        var userId = CurrentUserId;
        var budget = await _db.Budgets.Include(b => b.Category).FirstOrDefaultAsync(b => b.Id == id);
        if (budget == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == budget.GroupId && gm.UserId == userId)) return Forbid();
        if (request.LimitAmount.HasValue) budget.LimitAmount = request.LimitAmount.Value;
        await _db.SaveChangesAsync();
        var spent = await _db.Expenses.Where(e => e.GroupId == budget.GroupId && e.CategoryId == budget.CategoryId && e.Date.Month == budget.Month && e.Date.Year == budget.Year).SumAsync(e => e.Amount);
        var pct = budget.LimitAmount > 0 ? (spent / budget.LimitAmount) * 100 : 0;
        var dto = new BudgetDto(budget.Id, budget.LimitAmount, spent, pct, budget.CategoryId, budget.Category.Name, budget.Category.Icon, budget.Category.Color, budget.GroupId, budget.Month, budget.Year);
        await _hub.Clients.Group($"group_{budget.GroupId}").SendAsync("BudgetUpdated", dto);
        return dto;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBudget(int id)
    {
        var userId = CurrentUserId;
        var budget = await _db.Budgets.FindAsync(id);
        if (budget == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == budget.GroupId && gm.UserId == userId)) return Forbid();
        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();
        await _hub.Clients.Group($"group_{budget.GroupId}").SendAsync("BudgetDeleted", new { id, groupId = budget.GroupId });
        return NoContent();
    }
}
