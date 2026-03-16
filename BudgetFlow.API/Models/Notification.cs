using System.ComponentModel.DataAnnotations;

namespace BudgetFlow.API.Models;

public class Notification
{
    public int Id { get; set; }
    [Required] public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public bool IsRead { get; set; } = false;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? GroupId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
