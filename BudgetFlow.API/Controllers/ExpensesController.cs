using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Hubs;
using BudgetFlow.API.Models;
using BudgetFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class ExpensesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SyncHub> _hub;
    private readonly BudgetAlertService _budgetAlert;

    public ExpensesController(AppDbContext db, IHubContext<SyncHub> hub, BudgetAlertService budgetAlert)
    { _db = db; _hub = hub; _budgetAlert = budgetAlert; }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<ExpenseDto>>> GetExpenses(
        [FromQuery] int groupId, [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int? categoryId, [FromQuery] int? userId)
    {
        var currentUserId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == currentUserId)) return Forbid();
        var query = _db.Expenses.Include(e => e.Category).Include(e => e.User).Where(e => e.GroupId == groupId);
        if (from.HasValue) query = query.Where(e => e.Date >= from.Value);
        if (to.HasValue) query = query.Where(e => e.Date <= to.Value);
        if (categoryId.HasValue) query = query.Where(e => e.CategoryId == categoryId.Value);
        if (userId.HasValue) query = query.Where(e => e.UserId == userId.Value);
        var expenses = await query.OrderByDescending(e => e.Date).ToListAsync();
        return expenses.Select(MapToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseDto>> GetExpense(int id)
    {
        var userId = CurrentUserId;
        var expense = await _db.Expenses.Include(e => e.Category).Include(e => e.User).FirstOrDefaultAsync(e => e.Id == id);
        if (expense == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == expense.GroupId && gm.UserId == userId)) return Forbid();
        return MapToDto(expense);
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> CreateExpense(CreateExpenseRequest request)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == userId)) return Forbid();
        var expense = new Expense { Amount = request.Amount, Description = request.Description, Date = request.Date, CategoryId = request.CategoryId, UserId = userId, GroupId = request.GroupId };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();
        await _db.Entry(expense).Reference(e => e.Category).LoadAsync();
        await _db.Entry(expense).Reference(e => e.User).LoadAsync();
        var dto = MapToDto(expense);
        await _hub.Clients.Group($"group_{request.GroupId}").SendAsync("ExpenseCreated", dto);
        await _budgetAlert.CheckAndNotifyBudgetAsync(request.GroupId, request.CategoryId, request.Date.Month, request.Date.Year);
        return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ExpenseDto>> UpdateExpense(int id, UpdateExpenseRequest request)
    {
        var userId = CurrentUserId;
        var expense = await _db.Expenses.Include(e => e.Category).Include(e => e.User).FirstOrDefaultAsync(e => e.Id == id);
        if (expense == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == expense.GroupId && gm.UserId == userId)) return Forbid();
        if (request.Amount.HasValue) expense.Amount = request.Amount.Value;
        if (request.Description != null) expense.Description = request.Description;
        if (request.Date.HasValue) expense.Date = request.Date.Value;
        if (request.CategoryId.HasValue) { expense.CategoryId = request.CategoryId.Value; await _db.Entry(expense).Reference(e => e.Category).LoadAsync(); }
        expense.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var dto = MapToDto(expense);
        await _hub.Clients.Group($"group_{expense.GroupId}").SendAsync("ExpenseUpdated", dto);
        await _budgetAlert.CheckAndNotifyBudgetAsync(expense.GroupId, expense.CategoryId, expense.Date.Month, expense.Date.Year);
        return dto;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var userId = CurrentUserId;
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == expense.GroupId && gm.UserId == userId)) return Forbid();
        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync();
        await _hub.Clients.Group($"group_{expense.GroupId}").SendAsync("ExpenseDeleted", new { id, groupId = expense.GroupId });
        return NoContent();
    }

    private static ExpenseDto MapToDto(Expense e) => new(e.Id, e.Amount, e.Description, e.Date,
        e.CategoryId, e.Category.Name, e.Category.Icon, e.Category.Color, e.UserId, e.User.FullName, e.GroupId, e.CreatedAt, e.UpdatedAt);
}
