using System.ComponentModel.DataAnnotations;
using BudgetFlow.API.Models;

namespace BudgetFlow.API.DTOs;

public record CategoryDto(
    int Id,
    string Name,
    string? Icon,
    string? Color,
    CategoryType Type,
    bool IsDefault
);
