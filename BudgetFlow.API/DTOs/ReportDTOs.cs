namespace BudgetFlow.API.DTOs;

public record ReportSummary(
    decimal TotalIncome,
    decimal TotalExpense,
    decimal Balance,
    List<CategoryBreakdown> ExpenseByCategory,
    List<CategoryBreakdown> IncomeByCategory,
    List<DailyTotal> DailyTotals
);

public record CategoryBreakdown(
    int CategoryId,
    string CategoryName,
    string? CategoryIcon,
    string? CategoryColor,
    decimal Amount,
    decimal Percentage
);

public record DailyTotal(
    DateTime Date,
    decimal Income,
    decimal Expense
);

public record MonthlyReport(
    int Month,
    int Year,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal Balance,
    List<CategoryBreakdown> ExpenseByCategory,
    List<CategoryBreakdown> IncomeByCategory,
    List<BudgetStatus> BudgetStatuses
);

public record BudgetStatus(
    int BudgetId,
    string CategoryName,
    string? CategoryIcon,
    string? CategoryColor,
    decimal LimitAmount,
    decimal SpentAmount,
    decimal Percentage,
    bool IsExceeded
);
