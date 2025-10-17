@echo off
echo ========================================
echo Starting Expo with Correct IP
echo ========================================
echo.
echo Setting IP to 192.168.1.5...
echo.

set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5
npx expo start --host lan

echo.
echo If you still see 192.168.0.230, try:
echo   npx expo start --tunnel
echo.
pause
