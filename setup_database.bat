@echo off
chcp 65001 >nul
echo 🍓 草莓生长溯源系统 - 快速数据库配置
echo ================================================

REM 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，请先安装 Python 3.8+
    echo 📥 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python 已安装

REM 检查 MySQL 是否可用
echo 🔍 检查 MySQL 安装状态...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MySQL 命令行工具不在 PATH 中，尝试查找常见安装位置...
    
    REM 检查常见的 MySQL 安装路径
    
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        echo ✅ 找到 MySQL 安装目录: C:\Program Files\MySQL\MySQL Server 8.0\bin
        set "PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin;%PATH%"
        goto mysql_found
    )
    
    if exist "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe" (
        echo ✅ 找到 MySQL 安装目录: C:\Program Files\MySQL\MySQL Server 8.1\bin
        set "PATH=C:\Program Files\MySQL\MySQL Server 8.1\bin;%PATH%"
        goto mysql_found
    )
    
    if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
        echo ✅ 找到 MySQL 安装目录: C:\Program Files\MySQL\MySQL Server 5.7\bin
        set "PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin;%PATH%"
        goto mysql_found
    )
    
    if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        echo ✅ 找到 MySQL 安装目录: C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin
        set "PATH=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin;%PATH%"
        goto mysql_found
    )
    
    if exist "C:\xampp\mysql\bin\mysql.exe" (
        echo ✅ 找到 MySQL 安装目录: C:\xampp\mysql\bin
        set "PATH=C:\xampp\mysql\bin;%PATH%"
        goto mysql_found
    )
    
    if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
        echo ✅ 找到 MySQL 安装目录: C:\wamp64\bin\mysql\mysql8.0.31\bin
        set "PATH=C:\wamp64\bin\mysql\mysql8.0.31\bin;%PATH%"
        goto mysql_found
    )
    
    echo ❌ 未找到 MySQL 安装
    echo 💡 请确保 MySQL 已正确安装，或手动将 MySQL bin 目录添加到 PATH
    echo 📍 常见安装路径：
    echo    C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo    C:\xampp\mysql\bin
    echo    C:\wamp64\bin\mysql\mysql8.0.31\bin
    echo.
    echo 🛠️  手动添加到 PATH 的步骤：
    echo    1. 右键点击 '此电脑' → '属性'
    echo    2. 点击 '高级系统设置'
    echo    3. 点击 '环境变量'
    echo    4. 在系统变量中找到 'Path'，点击 '编辑'
    echo    5. 点击 '新建'，添加 MySQL bin 目录路径
    echo    6. 确定保存，重新打开命令行
    echo.
    echo 🔧 或者，您可以现在手动指定 MySQL 路径：
    set /p "MANUAL_MYSQL_PATH=请输入 MySQL bin 目录的完整路径 (按 Enter 跳过): "
    
    if not "%MANUAL_MYSQL_PATH%"=="" (
        if exist "%MANUAL_MYSQL_PATH%\mysql.exe" (
            echo ✅ 找到手动指定的 MySQL: %MANUAL_MYSQL_PATH%
            set "PATH=%MANUAL_MYSQL_PATH%;%PATH%"
            goto mysql_found
        ) else (
            echo ❌ 指定的路径中找不到 mysql.exe
        )
    )
    echo.
    pause
    exit /b 1
)

:mysql_found

echo ✅ MySQL 客户端已安装

REM 安装 Python 依赖
echo.
echo 📦 安装 Python 依赖包...
pip install mysql-connector-python python-dotenv
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装成功

REM 运行数据库设置脚本
echo.
echo 🔧 启动数据库配置向导...
python setup_database.py
if errorlevel 1 (
    echo ❌ 数据库配置失败
    pause
    exit /b 1
)

echo.
echo 🎉 配置完成！
echo 📋 接下来可以运行：
echo    python verify_system.py  - 验证系统配置
echo    python main.py           - 启动应用
echo.
pause