@echo off
echo ============================================
echo   BudgetFlow - Starting Application
echo ============================================
echo.
echo Starting API on http://localhost:8085 ...
start "BudgetFlow API" cmd /k "cd /d "%~dp0BudgetFlow.API" && dotnet run"

echo Waiting for API to start...
timeout /t 5 /nobreak > nul

echo Starting React on http://localhost:8086 ...
start "BudgetFlow React" cmd /k "cd /d "%~dp0BudgetFlow.React" && npm start"

echo.
echo ============================================
echo   BudgetFlow is starting!
echo   API:   http://localhost:8085
echo   React: http://localhost:8086
echo   Swagger: http://localhost:8085/swagger
echo ============================================
