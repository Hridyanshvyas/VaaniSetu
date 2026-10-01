@echo off
:: ─────────────────────────────────────────────────────────
:: VaaniSetu Firewall Setup
:: RIGHT-CLICK this file → "Run as administrator"
:: ─────────────────────────────────────────────────────────

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please RIGHT-CLICK this file and choose "Run as administrator"
    pause
    exit /b 1
)

echo Opening firewall ports for VaaniSetu...

netsh advfirewall firewall delete rule name="VaaniSetu-8000" >nul 2>&1
netsh advfirewall firewall delete rule name="VaaniSetu-8001" >nul 2>&1
netsh advfirewall firewall delete rule name="VaaniSetu-8002" >nul 2>&1
netsh advfirewall firewall delete rule name="VaaniSetu-8004" >nul 2>&1

netsh advfirewall firewall add rule name="VaaniSetu-8000" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="VaaniSetu-8001" dir=in action=allow protocol=TCP localport=8001
netsh advfirewall firewall add rule name="VaaniSetu-8002" dir=in action=allow protocol=TCP localport=8002
netsh advfirewall firewall add rule name="VaaniSetu-8004" dir=in action=allow protocol=TCP localport=8004

echo.
echo ✓ All 4 ports are now open (8000, 8001, 8002, 8004)
echo ✓ Phones connected to your hotspot can now reach the backend.
echo.
pause
