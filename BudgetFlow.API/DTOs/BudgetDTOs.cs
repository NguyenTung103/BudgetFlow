using System.ComponentModel.DataAnnotations;

namespace BudgetFlow.API.DTOs;

public record CreateBudgetRequest(
    [Required] decimal LimitAmount,
    [Required] int CategoryId,
    [Required] int GroupId,
    [Required] int Month,
    [Required] int Year
);

public record UpdateBudgetRequest(decimal? LimitAmount);

public record BudgetDto(
    int Id,
    decimal LimitAmount,
    decimal SpentAmount,
    decimal Percentage,
    int CategoryId,
    string CategoryName,
    string? CategoryIcon,
    string? CategoryColor,
    int GroupId,
    int Month,
    int Year
);
