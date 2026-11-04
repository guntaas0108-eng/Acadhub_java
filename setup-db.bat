@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo        AcadHub MySQL Database Setup Script
echo ====================================================
echo.

:: Auto-detect mysql command-line client
set "MYSQL_EXE="
where mysql >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "MYSQL_EXE=mysql"
) else (
    for %%P in (
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
        "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe"
        "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysql.exe"
        "C:\Program Files\MariaDB*\bin\mysql.exe"
    ) do (
        if exist %%P set "MYSQL_EXE=%%~P"
    )
)

if not defined MYSQL_EXE (
    echo [ERROR] MySQL client was not found in PATH or standard installation paths.
    echo Please ensure MySQL Server / client is installed.
    pause
    exit /b 1
)

echo [*] Detected MySQL Client: %MYSQL_EXE%
echo.

set /p MYSQL_PORT="Enter MySQL Port [Press Enter for 3306, or type 3307]: "
if "%MYSQL_PORT%"=="" set "MYSQL_PORT=3306"

set /p MYSQL_PASS="Enter MySQL root password [Leave empty if none]: "

echo.
echo [*] Initializing database 'acadhub_java' on 127.0.0.1:%MYSQL_PORT%...

set "PW_ARG="
if not "%MYSQL_PASS%"=="" set "PW_ARG=-p%MYSQL_PASS%"

for %%F in (
    "sql\01_database.sql"
    "sql\02_tables.sql"
    "sql\03_alter_tables.sql"
    "sql\04_insert_data.sql"
    "sql\06_views.sql"
    "sql\07_triggers.sql"
    "sql\08_procedures.sql"
    "sql\09_functions.sql"
    "sql\10_cursor_procedures.sql"
    "sql\14_study_material_submissions.sql"
    "sql\15_accountability_seed.sql"
    "sql\16_file_upload_support.sql"
) do (
    echo [*] Executing %%F ...
    "%MYSQL_EXE%" -h 127.0.0.1 -P %MYSQL_PORT% -u root %PW_ARG% < "%%F"
    if errorlevel 1 goto failed
)

echo.
echo ====================================================
echo  Database 'acadhub_java' setup completed successfully!
echo ====================================================
echo.
pause
exit /b 0

:failed
echo.
echo [ERROR] An error occurred while executing SQL scripts.
echo Please check that MySQL is running on port %MYSQL_PORT% and your password is correct.
echo.
pause
exit /b 1
