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
public class IncomesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SyncHub> _hub;
    public IncomesController(AppDbContext db, IHubContext<SyncHub> hub) { _db = db; _hub = hub; }
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<IncomeDto>>> GetIncomes(
        [FromQuery] int groupId, [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int? categoryId, [FromQuery] int? userId)
    {
        var currentUserId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == currentUserId)) return Forbid();
        var query = _db.Incomes.Include(i => i.Category).Include(i => i.User).Where(i => i.GroupId == groupId);
        if (from.HasValue) query = query.Where(i => i.Date >= from.Value);
        if (to.HasValue) query = query.Where(i => i.Date <= to.Value);
        if (categoryId.HasValue) query = query.Where(i => i.CategoryId == categoryId.Value);
        if (userId.HasValue) query = query.Where(i => i.UserId == userId.Value);
        return (await query.OrderByDescending(i => i.Date).ToListAsync()).Select(MapToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IncomeDto>> GetIncome(int id)
    {
        var userId = CurrentUserId;
        var income = await _db.Incomes.Include(i => i.Category).Include(i => i.User).FirstOrDefaultAsync(i => i.Id == id);
        if (income == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == income.GroupId && gm.UserId == userId)) return Forbid();
        return MapToDto(income);
    }

    [HttpPost]
    public async Task<ActionResult<IncomeDto>> CreateIncome(CreateIncomeRequest request)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == userId)) return Forbid();
        var income = new Income { Amount = request.Amount, Description = request.Description, Date = request.Date, CategoryId = request.CategoryId, UserId = userId, GroupId = request.GroupId };
        _db.Incomes.Add(income);
        await _db.SaveChangesAsync();
        await _db.Entry(income).Reference(i => i.Category).LoadAsync();
        await _db.Entry(income).Reference(i => i.User).LoadAsync();
        var dto = MapToDto(income);
        await _hub.Clients.Group($"group_{request.GroupId}").SendAsync("IncomeCreated", dto);
        return CreatedAtAction(nameof(GetIncome), new { id = income.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IncomeDto>> UpdateIncome(int id, UpdateIncomeRequest request)
    {
        var userId = CurrentUserId;
        var income = await _db.Incomes.Include(i => i.Category).Include(i => i.User).FirstOrDefaultAsync(i => i.Id == id);
        if (income == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == income.GroupId && gm.UserId == userId)) return Forbid();
        if (request.Amount.HasValue) income.Amount = request.Amount.Value;
        if (request.Description != null) income.Description = request.Description;
        if (request.Date.HasValue) income.Date = request.Date.Value;
        if (request.CategoryId.HasValue) { income.CategoryId = request.CategoryId.Value; await _db.Entry(income).Reference(i => i.Category).LoadAsync(); }
        income.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var dto = MapToDto(income);
        await _hub.Clients.Group($"group_{income.GroupId}").SendAsync("IncomeUpdated", dto);
        return dto;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteIncome(int id)
    {
        var userId = CurrentUserId;
        var income = await _db.Incomes.FindAsync(id);
        if (income == null) return NotFound();
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == income.GroupId && gm.UserId == userId)) return Forbid();
        _db.Incomes.Remove(income);
        await _db.SaveChangesAsync();
        await _hub.Clients.Group($"group_{income.GroupId}").SendAsync("IncomeDeleted", new { id, groupId = income.GroupId });
        return NoContent();
    }

    private static IncomeDto MapToDto(Income i) => new(i.Id, i.Amount, i.Description, i.Date,
        i.CategoryId, i.Category.Name, i.Category.Icon, i.Category.Color, i.UserId, i.User.FullName, i.GroupId, i.CreatedAt, i.UpdatedAt);
}
