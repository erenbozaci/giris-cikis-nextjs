
@echo off
title Giriş Çıkış - Uygulama Baslat
color 0A
echo.
echo  ====================================================
echo   Giriş Çıkış - Uygulama Baslat
echo  ====================================================
echo.

REM Check if Node.js is installed
echo [1/4] Node.js kontrol ediliyor...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Node.js yuklu degil!
    echo.
    echo Lutfen asagidaki adimları takip edin:
    echo 1. https://nodejs.org/ adresine gidin
    echo 2. LTS versiyonu indirin ve yukleyin
    echo 3. Bu dosyayi tekrar calistirin
    echo.
    pause
    exit /b 1
)
echo [✓] Node.js yuklu

REM Check if we're in the right directory
if not exist "package.json" (
    echo.
    echo [HATA] package.json bulunamadi!
    echo Bu dosya proje klasorunde olmali.
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
echo [2/4] Bagimlilikar kontrol ediliyor...
if not exist "node_modules" (
    echo [!] node_modules bulunamadi, bagimlilikar yukleniyor...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo [HATA] Bagimlilikar yuklenemedi!
        echo Lutfen internet baglantınızı kontrol edin.
        echo.
        pause
        exit /b 1
    )
)
echo [✓] Bagimlilikar hazir

echo [3/4] Uygulama baslatiliyor...
echo.
echo ┌─────────────────────────────────────────────────┐
echo │  Uygulama http://localhost:3000 adresinde       │
echo │  baslatilacak ve otomatik olarak acilacak.      │
echo │                                                 │
echo │  Uygulamayi kapatmak icin bu pencereyi          │
echo │  kapatabilir veya Ctrl+C basabilirsiniz.       │
echo └─────────────────────────────────────────────────┘
echo.

REM Start the development server in background and wait for it to be ready
start /b npm run dev

echo Sunucu baslatiliyor, lutfen bekleyin...
timeout /t 3 /nobreak >nul

REM Try to open browser multiple times until server is ready
echo [4/4] Tarayici aciliyor...
for /l %%i in (1,1,10) do (
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if %errorlevel% equ 0 (
        start http://localhost:3000
        goto :server_ready
    )
    echo Sunucu hazir olmasi bekleniyor... (%%i/10)
)

REM If curl failed, try anyway
echo Sunucu durumu tespit edilemedi, tarayici aciliyor...
start http://localhost:3000

:server_ready
echo.
echo [✓] Uygulama baslatildi!
echo.
echo Tarayicinizda http://localhost:3000 adresi acildi.
echo Eger acilmadiysa, bu adresi manuel olarak ziyaret edin.
echo.
echo Bu pencereyi acik tutun - kapatirsaniz uygulama da kapanir.
echo.

REM Wait for the npm process to finish (when user closes it)
:wait_loop
timeout /t 5 /nobreak >nul
tasklist /fi "imagename eq node.exe" | find "node.exe" >nul
if %errorlevel% equ 0 goto wait_loop

echo.
echo Uygulama kapandi.
echo Tesekkurler!
timeout /t 3 /nobreak >nul
