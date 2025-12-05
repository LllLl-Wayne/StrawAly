@echo off
chcp 65001 >nul
echo 🚀 MySQL 快速修复 - 强制解决方案
echo ================================================

echo 💡 由于 PATH 变量问题，我们将使用直接路径方式运行

REM 常见的 MySQL 安装路径
set "MYSQL_PATHS=C:\Program Files\MySQL\MySQL Server 8.0\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files\MySQL\MySQL Server 8.1\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\xampp\mysql\bin"
set "MYSQL_PATHS=%MYSQL_PATHS%;C:\wamp64\bin\mysql\mysql8.0.31\bin"

echo 🔍 正在搜索 MySQL...
set "MYSQL_FOUND="

for %%p in ("%MYSQL_PATHS:;=";"%") do (
    if exist "%%~p\mysql.exe" (
        echo ✅ 找到 MySQL: %%~p
        set "MYSQL_BIN=%%~p"
        set "MYSQL_FOUND=1"
        goto found
    )
)

:found
if not defined MYSQL_FOUND (
    echo ❌ 未找到 MySQL 安装
    echo 📝 请手动输入 MySQL bin 目录路径：
    set /p "MYSQL_BIN=MySQL bin 路径: "
    
    if not exist "%MYSQL_BIN%\mysql.exe" (
        echo ❌ 指定路径无效
        pause
        exit /b 1
    )
)

echo.
echo 🧪 测试 MySQL 连接...
"%MYSQL_BIN%\mysql.exe" --version
if errorlevel 1 (
    echo ❌ MySQL 测试失败
    pause
    exit /b 1
)

echo ✅ MySQL 可用！

REM 检查 Python
echo.
echo 🐍 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装
    pause
    exit /b 1
)

echo ✅ Python 可用

REM 安装依赖
echo.
echo 📦 安装依赖包...
pip install mysql-connector-python python-dotenv pillow qrcode

echo.
echo 🔧 开始数据库配置...
echo 💡 请在配置过程中使用以下信息：
echo    MySQL 主机: localhost
echo    MySQL 端口: 3306
echo    管理员用户: root

REM 创建临时的设置脚本，使用完整路径
echo 🛠️ 创建临时配置脚本...

(
echo import os
echo import sys
echo import mysql.connector
echo from mysql.connector import Error
echo import getpass
echo.
echo # 设置 MySQL 路径
echo mysql_bin = r"%MYSQL_BIN%"
echo os.environ['PATH'] = mysql_bin + ";" + os.environ.get('PATH', ''^^^)
echo.
echo # 导入原始设置脚本的内容
echo exec(open('setup_database.py'^^^).read(^^^)^^^)
) > temp_mysql_setup.py

echo 🚀 运行数据库配置...
python temp_mysql_setup.py

REM 清理临时文件
if exist temp_mysql_setup.py del temp_mysql_setup.py

echo.
echo 🎉 配置完成！
echo 💡 提示：如果以后 MySQL 命令仍然不可用，请运行此脚本
echo.
pause