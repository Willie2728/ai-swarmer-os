@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-AI-SWARMER-OS.ps1"
if errorlevel 1 pause
