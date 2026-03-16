using System.ComponentModel.DataAnnotations;

namespace BudgetFlow.API.Models;

public enum CategoryType { Expense, Income }

public class Category
{
    public int Id { get; set; }
    [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public CategoryType Type { get; set; }
    public bool IsDefault { get; set; } = false;

    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<Income> Incomes { get; set; } = new List<Income>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
}
