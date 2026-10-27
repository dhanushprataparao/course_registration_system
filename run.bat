@echo off
title College Course Registration & Prerequisite Management System
echo ======================================================================
echo College Course Registration & Prerequisite Management System
echo Powered by Discrete Mathematics (DAG, Posets, Topological Sort)
echo ======================================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in PATH.
    echo Trying local AppData Python installation...
    if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set PYTHON_BIN="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else (
        echo Please ensure Python 3.9+ is installed.
        pause
        exit /b 1
    )
) else (
    set PYTHON_BIN=python
)

echo Using Python: %PYTHON_BIN%
echo Installing requirements...
%PYTHON_BIN% -m pip install -r requirements.txt --quiet

echo.
echo Starting web server at http://127.0.0.1:5000 ...
echo Press Ctrl+C to terminate the server.
echo.
%PYTHON_BIN% app.py
pause
