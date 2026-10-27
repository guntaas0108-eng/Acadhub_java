@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"
set "PATH=%JAVA_HOME%\bin;%LOCALAPPDATA%\Programs\apache-maven-3.9.6\bin;%PATH%"

netstat -ano | findstr :3307 >nul
if errorlevel 1 (
    echo Starting local MySQL database on port 3307...
    start /b "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="%~dp0mysql-data" --port=3307 --mysqlx=0
    timeout /t 2 /nobreak >nul
)

echo Starting AcadHub Web Server (Spring Boot)...
echo Opening Brave at http://localhost:8085 ...
echo Press Ctrl+C to stop the server.
echo.

:: Automatically open Brave browser once server starts
start "" /b powershell -Command "Start-Sleep -Seconds 3; if (Test-Path 'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe') { Start-Process 'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe' 'http://localhost:8085' } else { Start-Process 'http://localhost:8085' }"

mvn spring-boot:run
pause
