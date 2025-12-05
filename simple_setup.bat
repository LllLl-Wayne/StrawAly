@echo off
chcp 65001 >nul
echo 🍓 草莓溯源系统 - 简化配置工具
echo ================================================

echo 🐍 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装，请先安装 Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python 可用

echo.
echo 📦 安装 Python 依赖...
pip install mysql-connector-python python-dotenv pillow qrcode
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装成功

echo.
echo 🔧 启动数据库配置（绕过 PATH 问题）...
echo 💡 此工具会自动处理 MySQL 路径问题

REM 创建临时的 Python 脚本，直接处理 MySQL 路径
(
echo import os
echo import sys
echo import subprocess
echo.
echo # 常见的 MySQL 安装路径
echo mysql_paths = [
echo     r"C:\Program Files\MySQL\MySQL Server 8.0\bin",
echo     r"C:\Program Files\MySQL\MySQL Server 8.1\bin", 
echo     r"C:\Program Files\MySQL\MySQL Server 5.7\bin",
echo     r"C:\Program Files (x86^)\MySQL\MySQL Server 8.0\bin",
echo     r"C:\xampp\mysql\bin",
echo     r"C:\wamp64\bin\mysql\mysql8.0.31\bin",
echo     r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin"
echo ]
echo.
echo # 查找 MySQL
echo mysql_bin = None
echo for path in mysql_paths:
echo     mysql_exe = os.path.join(path, "mysql.exe"^)
echo     if os.path.exists(mysql_exe^):
echo         print(f"✅ 找到 MySQL: {path}"^)
echo         mysql_bin = path
echo         break
echo.
echo if not mysql_bin:
echo     manual_path = input("❌ 未找到 MySQL，请输入 MySQL bin 目录路径: "^).strip(^)
echo     if manual_path and os.path.exists(os.path.join(manual_path, "mysql.exe"^)^):
echo         mysql_bin = manual_path
echo     else:
echo         print("❌ 无效路径，退出"^)
echo         sys.exit(1^)
echo.
echo # 临时添加到环境变量
echo os.environ['PATH'] = mysql_bin + ";" + os.environ.get('PATH', ''^^^)
echo.
echo print("🚀 启动数据库配置向导..."^)
echo print("💡 请在配置过程中使用以下信息："^)
echo print("   MySQL 主机: localhost"^)
echo print("   MySQL 端口: 3306"^)
echo print("   管理员用户: root"^)
echo print(^)
echo.
echo # 导入并运行原始配置脚本
echo try:
echo     exec(open('setup_database.py'^).read(^)^)
echo except Exception as e:
echo     print(f"❌ 配置过程出错: {e}"^)
echo     input("按回车键退出..."^)
echo     sys.exit(1^)
) > temp_setup.py

python temp_setup.py

REM 清理临时文件
if exist temp_setup.py del temp_setup.py

echo.
echo 🎉 配置完成！
pause