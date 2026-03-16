using System.ComponentModel.DataAnnotations;

namespace BudgetFlow.API.DTOs;

public record CreateIncomeRequest(
    [Required] decimal Amount,
    string? Description,
    [Required] DateTime Date,
    [Required] int CategoryId,
    [Required] int GroupId
);

public record UpdateIncomeRequest(
    decimal? Amount,
    string? Description,
    DateTime? Date,
    int? CategoryId
);

public record IncomeDto(
    int Id,
    decimal Amount,
    string? Description,
    DateTime Date,
    int CategoryId,
    string CategoryName,
    string? CategoryIcon,
    string? CategoryColor,
    int UserId,
    string UserFullName,
    int GroupId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
