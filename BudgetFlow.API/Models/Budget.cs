using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BudgetFlow.API.Models;

public class Budget
{
    public int Id { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal LimitAmount { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public int Month { get; set; }
    public int Year { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
