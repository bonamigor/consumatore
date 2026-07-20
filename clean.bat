@echo off
echo ========================================
echo Limpando projeto Nuxt...
echo ========================================

echo.
echo 1. Parando processos Node...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Removendo pastas...
rmdir /s /q node_modules 2>nul
rmdir /s /q .nuxt 2>nul
rmdir /s /q .output 2>nul
del package-lock.json 2>nul

echo.
echo 3. Limpando cache...
call npm cache clean --force

echo.
echo 4. Instalando dependencias...
call npm install

echo.
echo 5. Instalando Pinia...
call npm install @pinia/nuxt @vueuse/core

echo.
echo 6. Instalando Tailwind...
call npm install -D @nuxtjs/tailwindcss tailwindcss postcss autoprefixer

echo.
echo ========================================
echo Limpeza concluida!
echo Execute: npm run dev
echo ========================================
pause