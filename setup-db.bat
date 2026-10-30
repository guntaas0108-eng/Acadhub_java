@echo off
setlocal
set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

if not exist "%MYSQL_EXE%" (
    echo Error: MySQL was not found at "%MYSQL_EXE%"
    pause
    exit /b 1
)

echo ====================================================
echo        AcadHub MySQL Database Setup Script
echo ====================================================
echo.
set /p MYSQL_PASS="Enter MySQL root password: "

echo.
echo Initializing database acadhub_java and executing scripts...

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\01_database.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\02_tables.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\03_alter_tables.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\04_insert_data.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\06_views.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\07_triggers.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\08_procedures.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\09_functions.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\10_cursor_procedures.sql"
if errorlevel 1 goto failed

"%MYSQL_EXE%" -u root -p"%MYSQL_PASS%" < "sql\14_study_material_submissions.sql"
if errorlevel 1 goto failed

echo.
echo ====================================================
echo  Database 'acadhub_java' setup completed successfully!
echo ====================================================
echo.
pause
exit /b 0

:failed
echo.
echo [ERROR] An error occurred while running the SQL scripts.
echo Please check your password or MySQL status.
echo.
pause
exit /b 1
