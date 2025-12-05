@echo off
chcp 65001 >nul
echo 🍓 草莓溯源系统 - MySQL 快速配置 (已安装 MySQL)
echo ================================================

echo 🔍 正在搜索您电脑上的 MySQL 安装...

REM 扩展的 MySQL 搜索路径
set "MYSQL_FOUND="
set "MYSQL_PATHS=C:\Program Files\MySQL\MySQL Server 8.0\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files\MySQL\MySQL Server 8.1\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files\MySQL\MySQL Server 5.7\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files (x86)\MySQL\MySQL Server 8.1\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\MySQL\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\xampp\mysql\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\wamp64\bin\mysql\mysql8.0.31\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\wamp64\bin\mysql\mysql8.0.32\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\wamp64\bin\mysql\mysql8.1.0\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin"

for %%p in ("%MYSQL_PATHS:;=";"%") do (
    if exist "%%~p\mysql.exe" (
        echo ✅ 找到 MySQL: %%~p
        set "MYSQL_PATH=%%~p"
        set "MYSQL_FOUND=1"
        goto found_mysql
    )
)

REM 如果没有找到，让用户手动输入
if not defined MYSQL_FOUND (
    echo ⚠️  自动搜索未找到 MySQL，请手动指定路径
    echo.
    echo 📝 请打开文件资源管理器，找到您的 MySQL 安装目录
    echo    通常在: C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo.
    set /p "MYSQL_PATH=请输入 MySQL bin 目录的完整路径: "
    
    if not exist "%MYSQL_PATH%\mysql.exe" (
        echo ❌ 在指定路径中找不到 mysql.exe
        echo 💡 请确保路径正确，例如: C:\Program Files\MySQL\MySQL Server 8.0\bin
        pause
        exit /b 1
    )
)

:found_mysql
echo.
echo 🎯 使用 MySQL 路径: %MYSQL_PATH%

REM 临时添加到当前会话的 PATH
set "PATH=%MYSQL_PATH%;%PATH%"

REM 测试 MySQL 连接
echo.
echo 🔍 测试 MySQL 连接...
"%MYSQL_PATH%\mysql.exe" --version
if errorlevel 1 (
    echo ❌ MySQL 测试失败
    pause
    exit /b 1
)

echo ✅ MySQL 可用!

REM 检查 Python
echo.
echo 🐍 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo ✅ Python 已安装

REM 安装依赖
echo.
echo 📦 安装 Python 依赖...
pip install mysql-connector-python python-dotenv pillow qrcode
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装成功

REM 运行数据库设置
echo.
echo 🔧 启动数据库配置向导...
echo 💡 配置过程中请使用以下信息：
echo    MySQL 主机: localhost
echo    MySQL 端口: 3306
echo    管理员用户: root
echo.

python setup_database.py

echo.
echo 🎉 配置完成！
echo.
echo 📋 重要提示：
echo    每次运行应用前，您需要确保 MySQL 在 PATH 中
echo    或者考虑永久添加 MySQL 到系统 PATH 环境变量
echo.
echo 🚀 现在可以运行：
echo    python main.py
echo.
pause