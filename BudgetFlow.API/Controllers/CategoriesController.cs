using BudgetFlow.API.Data;
using BudgetFlow.API.DTOs;
using BudgetFlow.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetFlow.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] string? type)
    {
        var query = _db.Categories.AsQueryable();
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<CategoryType>(type, true, out var catType))
            query = query.Where(c => c.Type == catType);
        var cats = await query.OrderBy(c => c.Name).ToListAsync();
        return cats.Select(c => new CategoryDto(c.Id, c.Name, c.Icon, c.Color, c.Type, c.IsDefault)).ToList();
    }
}
