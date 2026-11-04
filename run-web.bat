@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo             AcadHub Web Platform Launcher
echo ========================================================
echo.

:: 1. Auto-Detect Java 17+
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" goto java_found
)

for %%D in (
    "C:\Program Files\Microsoft\jdk-17*"
    "C:\Program Files\Eclipse Adoptium\jdk-17*"
    "C:\Program Files\Java\jdk-17*"
    "C:\Program Files\Java\jdk-21*"
    "C:\Program Files\Amazon Corretto\jdk17*"
    "C:\Program Files\BellSoft\LibericaJDK-17*"
) do (
    for /d %%P in (%%D) do (
        if exist "%%P\bin\java.exe" (
            set "JAVA_HOME=%%P"
            goto java_found
        )
    )
)

where java >nul 2>&1
if %ERRORLEVEL% equ 0 goto java_found

echo [ERROR] Java 17+ JDK was not detected on this machine.
echo Please install Java 17 or set JAVA_HOME in your environment variables.
pause
exit /b 1

:java_found
echo [*] Java detected: %JAVA_HOME%
set "PATH=%JAVA_HOME%\bin;%PATH%"

:: 2. Auto-Detect Maven
where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 goto maven_found

for %%M in (
    "%LOCALAPPDATA%\Programs\apache-maven-*\bin"
    "C:\Program Files\apache-maven-*\bin"
    "C:\apache-maven-*\bin"
) do (
    for /d %%P in (%%M) do (
        if exist "%%P\mvn.cmd" (
            set "PATH=%%P;%PATH%"
            goto maven_found
        )
    )
)

echo [ERROR] Apache Maven was not found in PATH.
echo Please ensure Maven is installed and in your PATH.
pause
exit /b 1

:maven_found
echo [*] Maven detected.

:: 3. Ensure Upload Directories Exist Automatically
if not exist "%~dp0uploads\materials" mkdir "%~dp0uploads\materials"
if not exist "%~dp0uploads\submissions" mkdir "%~dp0uploads\submissions"
echo [*] Storage upload directories initialized.

:: 4. Check MySQL daemon / port
netstat -ano | findstr :3307 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [*] MySQL detected running on port 3307.
) else (
    netstat -ano | findstr :3306 >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [*] MySQL detected running on default port 3306.
    ) else (
        if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
            if exist "%~dp0mysql-data" (
                echo [*] Launching local MySQL daemon on port 3307...
                start /b "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="%~dp0mysql-data" --port=3307 --mysqlx=0
                timeout /t 2 /nobreak >nul
            )
        )
    )
)

:: 5. Open browser automatically
echo.
echo [*] Launching AcadHub on http://localhost:8085 ...
start "" /b powershell -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:8085'"

:: 6. Run Spring Boot
mvn spring-boot:run
pause
