@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot"
set "PATH=%JAVA_HOME%\bin;%LOCALAPPDATA%\Programs\apache-maven-3.9.6\bin;%PATH%"

netstat -ano | findstr :3307 >nul
if errorlevel 1 (
    echo Starting local MySQL database on port 3307...
    start /b "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="%~dp0mysql-data" --port=3307 --mysqlx=0
    timeout /t 2 /nobreak >nul
)

echo Starting AcadHub Console / CLI Mode...
echo.
mvn compile exec:java -Dexec.mainClass="Main"
pause
