@echo off
echo Fixing TypeScript Issues...

cd frontend

echo Clearing Next.js cache...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo Reinstalling dependencies...
call npm install

echo Running type check...
call npm run typecheck

echo.
echo TypeScript fixes applied!
echo If you still see errors, try restarting your IDE.
pause