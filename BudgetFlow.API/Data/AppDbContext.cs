using BudgetFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BudgetFlow.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<GroupInvitation> GroupInvitations => Set<GroupInvitation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Group>()
            .HasOne(g => g.Owner).WithMany()
            .HasForeignKey(g => g.OwnerId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GroupMember>()
            .HasIndex(gm => new { gm.GroupId, gm.UserId }).IsUnique();

        modelBuilder.Entity<Budget>()
            .HasIndex(b => new { b.CategoryId, b.GroupId, b.Month, b.Year }).IsUnique();

        modelBuilder.Entity<GroupInvitation>()
            .HasOne(i => i.Group).WithMany()
            .HasForeignKey(i => i.GroupId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GroupInvitation>()
            .HasOne(i => i.Inviter).WithMany()
            .HasForeignKey(i => i.InviterId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GroupInvitation>()
            .HasOne(i => i.Invitee).WithMany()
            .HasForeignKey(i => i.InviteeId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GroupInvitation>()
            .HasIndex(i => new { i.GroupId, i.InviteeId, i.Status })
            .HasFilter("\"Status\" = 0"); // Only unique pending per group+invitee

        modelBuilder.Entity<Expense>()
            .HasOne(e => e.User).WithMany(u => u.Expenses)
            .HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Expense>()
            .HasOne(e => e.Group).WithMany(g => g.Expenses)
            .HasForeignKey(e => e.GroupId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Income>()
            .HasOne(i => i.User).WithMany(u => u.Incomes)
            .HasForeignKey(i => i.UserId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Income>()
            .HasOne(i => i.Group).WithMany(g => g.Incomes)
            .HasForeignKey(i => i.GroupId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Ăn uống", Icon = "🍔", Color = "#FF6B6B", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 2, Name = "Di chuyển", Icon = "🚗", Color = "#4ECDC4", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 3, Name = "Mua sắm", Icon = "🛍️", Color = "#45B7D1", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 4, Name = "Giải trí", Icon = "🎮", Color = "#96CEB4", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 5, Name = "Sức khỏe", Icon = "💊", Color = "#FFEAA7", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 6, Name = "Giáo dục", Icon = "📚", Color = "#DDA0DD", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 7, Name = "Nhà ở", Icon = "🏠", Color = "#98D8C8", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 8, Name = "Hóa đơn", Icon = "📄", Color = "#F7DC6F", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 9, Name = "Khác", Icon = "💸", Color = "#AEB6BF", Type = CategoryType.Expense, IsDefault = true },
            new Category { Id = 10, Name = "Lương", Icon = "💰", Color = "#27AE60", Type = CategoryType.Income, IsDefault = true },
            new Category { Id = 11, Name = "Thưởng", Icon = "🎁", Color = "#F39C12", Type = CategoryType.Income, IsDefault = true },
            new Category { Id = 12, Name = "Đầu tư", Icon = "📈", Color = "#2980B9", Type = CategoryType.Income, IsDefault = true },
            new Category { Id = 13, Name = "Kinh doanh", Icon = "🏢", Color = "#8E44AD", Type = CategoryType.Income, IsDefault = true },
            new Category { Id = 14, Name = "Thu nhập khác", Icon = "💵", Color = "#17A589", Type = CategoryType.Income, IsDefault = true }
        );
    }
}
