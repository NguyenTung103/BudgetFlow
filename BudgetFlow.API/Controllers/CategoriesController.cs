using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Models;
using BudgetFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICacheService _cache;
    public CategoriesController(AppDbContext db, ICacheService cache) { _db = db; _cache = cache; }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] string? type)
    {
        var cacheKey = $"categories:{type ?? "all"}";
        var cached = await _cache.GetAsync<List<CategoryDto>>(cacheKey);
        if (cached is not null) return cached;

        var query = _db.Categories.AsQueryable();
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<CategoryType>(type, true, out var catType))
            query = query.Where(c => c.Type == catType);
        var cats = await query.OrderBy(c => c.Name).ToListAsync();
        var result = cats.Select(c => new CategoryDto(c.Id, c.Name, c.Icon, c.Color, c.Type, c.IsDefault)).ToList();

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
        return result;
    }
}
