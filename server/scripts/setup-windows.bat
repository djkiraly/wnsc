@echo off
echo Setting up WNSC Database on Windows...
echo.

echo Checking if PostgreSQL is installed...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL command line tools not found in PATH.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo Or use pgAdmin to create the database manually.
    pause
    exit /b 1
)

echo PostgreSQL found! Creating database...
echo.

REM Create the database
psql -U postgres -c "CREATE DATABASE wnsc_db;"

if %errorlevel% equ 0 (
    echo Database 'wnsc_db' created successfully!
    echo.
    echo Now run the migrations:
    echo npm run migrate
    echo.
    echo Then seed with sample data:
    echo npm run seed
) else (
    echo Failed to create database. You may need to:
    echo 1. Make sure PostgreSQL service is running
    echo 2. Use the correct username (default is 'postgres')
    echo 3. Enter the correct password when prompted
)

pause