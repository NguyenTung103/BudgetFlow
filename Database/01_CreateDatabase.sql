-- BudgetFlow Database - Reference Script
-- Tables are auto-created by EF Core migrations
-- Run this only if you want manual setup

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BudgetFlowDB')
BEGIN
    CREATE DATABASE BudgetFlowDB;
    PRINT 'Database BudgetFlowDB created.';
END
ELSE
    PRINT 'Database BudgetFlowDB already exists.';
GO

USE BudgetFlowDB;
GO

-- Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    AvatarUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);
GO

-- Groups
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Groups' AND xtype='U')
CREATE TABLE Groups (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    OwnerId INT NOT NULL REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- GroupMembers
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GroupMembers' AND xtype='U')
CREATE TABLE GroupMembers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GroupId INT NOT NULL REFERENCES Groups(Id) ON DELETE CASCADE,
    UserId INT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    Role INT NOT NULL DEFAULT 0,  -- 0=Member, 1=Admin, 2=Owner
    JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE(GroupId, UserId)
);
GO

-- Categories
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
CREATE TABLE Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Icon NVARCHAR(20) NULL,
    Color NVARCHAR(20) NULL,
    Type INT NOT NULL,  -- 0=Expense, 1=Income
    IsDefault BIT NOT NULL DEFAULT 0
);
GO

-- Expenses
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Expenses' AND xtype='U')
CREATE TABLE Expenses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Amount DECIMAL(18,2) NOT NULL,
    Description NVARCHAR(500) NULL,
    Date DATETIME2 NOT NULL,
    CategoryId INT NOT NULL REFERENCES Categories(Id),
    UserId INT NOT NULL REFERENCES Users(Id),
    GroupId INT NOT NULL REFERENCES Groups(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

-- Incomes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Incomes' AND xtype='U')
CREATE TABLE Incomes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Amount DECIMAL(18,2) NOT NULL,
    Description NVARCHAR(500) NULL,
    Date DATETIME2 NOT NULL,
    CategoryId INT NOT NULL REFERENCES Categories(Id),
    UserId INT NOT NULL REFERENCES Users(Id),
    GroupId INT NOT NULL REFERENCES Groups(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);
GO

-- Budgets
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Budgets' AND xtype='U')
CREATE TABLE Budgets (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LimitAmount DECIMAL(18,2) NOT NULL,
    CategoryId INT NOT NULL REFERENCES Categories(Id),
    GroupId INT NOT NULL REFERENCES Groups(Id),
    Month INT NOT NULL,
    Year INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE(CategoryId, GroupId, Month, Year)
);
GO

-- Notifications
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
CREATE TABLE Notifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(MAX) NOT NULL,
    Type NVARCHAR(20) NOT NULL DEFAULT 'info',
    IsRead BIT NOT NULL DEFAULT 0,
    UserId INT NOT NULL REFERENCES Users(Id),
    GroupId INT NULL REFERENCES Groups(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- RefreshTokens
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RefreshTokens' AND xtype='U')
CREATE TABLE RefreshTokens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Token NVARCHAR(MAX) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    IsRevoked BIT NOT NULL DEFAULT 0,
    UserId INT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

PRINT 'All tables created successfully.';
