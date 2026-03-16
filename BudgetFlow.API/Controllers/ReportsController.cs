using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummary>> GetSummary([FromQuery] int groupId, [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId)) return Forbid();

        var expenses = await _db.Expenses.Include(e => e.Category)
            .Where(e => e.GroupId == groupId && e.Date >= from && e.Date <= to).ToListAsync();
        var incomes = await _db.Incomes.Include(i => i.Category)
            .Where(i => i.GroupId == groupId && i.Date >= from && i.Date <= to).ToListAsync();

        var totalExpense = expenses.Sum(e => e.Amount);
        var totalIncome = incomes.Sum(i => i.Amount);

        var expenseByCat = expenses.GroupBy(e => e.Category)
            .Select(g => new CategoryBreakdown(g.Key.Id, g.Key.Name, g.Key.Icon, g.Key.Color,
                g.Sum(e => e.Amount), totalExpense > 0 ? g.Sum(e => e.Amount) / totalExpense * 100 : 0))
            .OrderByDescending(c => c.Amount).ToList();

        var incomeByCat = incomes.GroupBy(i => i.Category)
            .Select(g => new CategoryBreakdown(g.Key.Id, g.Key.Name, g.Key.Icon, g.Key.Color,
                g.Sum(i => i.Amount), totalIncome > 0 ? g.Sum(i => i.Amount) / totalIncome * 100 : 0))
            .OrderByDescending(c => c.Amount).ToList();

        var allDates = Enumerable.Range(0, (int)(to - from).TotalDays + 1).Select(i => from.AddDays(i).Date);
        var dailyTotals = allDates.Select(date => new DailyTotal(date,
            incomes.Where(i => i.Date.Date == date).Sum(i => i.Amount),
            expenses.Where(e => e.Date.Date == date).Sum(e => e.Amount))).ToList();

        return new ReportSummary(totalIncome, totalExpense, totalIncome - totalExpense, expenseByCat, incomeByCat, dailyTotals);
    }

    [HttpGet("monthly")]
    public async Task<ActionResult<MonthlyReport>> GetMonthly([FromQuery] int groupId, [FromQuery] int month, [FromQuery] int year)
    {
        var userId = CurrentUserId;
        if (!await _db.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId)) return Forbid();

        var from = new DateTime(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var summaryResult = await GetSummary(groupId, from, to);
        if (summaryResult.Result != null) return summaryResult.Result!;
        var s = summaryResult.Value!;

        var budgets = await _db.Budgets.Include(b => b.Category)
            .Where(b => b.GroupId == groupId && b.Month == month && b.Year == year).ToListAsync();

        var budgetStatuses = new List<BudgetStatus>();
        foreach (var budget in budgets)
        {
            var spent = await _db.Expenses.Where(e => e.GroupId == groupId && e.CategoryId == budget.CategoryId
                && e.Date.Month == month && e.Date.Year == year).SumAsync(e => e.Amount);
            var pct = budget.LimitAmount > 0 ? spent / budget.LimitAmount * 100 : 0;
            budgetStatuses.Add(new BudgetStatus(budget.Id, budget.Category.Name, budget.Category.Icon,
                budget.Category.Color, budget.LimitAmount, spent, pct, spent > budget.LimitAmount));
        }

        return new MonthlyReport(month, year, s.TotalIncome, s.TotalExpense, s.Balance,
            s.ExpenseByCategory, s.IncomeByCategory, budgetStatuses);
    }
}
