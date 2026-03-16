@echo off
echo ============================================
echo   BudgetFlow - Setup Script
echo ============================================
echo.

echo [1/3] Restoring .NET packages...
cd BudgetFlow.API
dotnet restore
if errorlevel 1 goto error

echo.
echo [2/3] Creating EF Core migration...
dotnet ef migrations add InitialCreate 2>nul || echo Migration already exists, skipping...

echo.
echo [3/3] Applying database migrations...
dotnet ef database update
if errorlevel 1 goto error

cd ..
echo.
echo [4/4] Installing React packages...
cd BudgetFlow.React
npm install
if errorlevel 1 goto error

cd ..
echo.
echo ============================================
echo   Setup completed successfully!
echo   Run 'start.bat' to start the application.
echo ============================================
goto end

:error
echo.
echo ERROR: Setup failed. Please check the error above.
pause
exit /b 1

:end
pause
