@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔍 MySQL PATH 问题详细诊断报告
echo ================================================
echo.

echo 📋 基本信息：
echo 操作系统：%OS%
echo 用户名：%USERNAME%
echo 当前目录：%CD%
echo.

echo 🔍 PATH 变量分析：
echo ----------------------------------------
echo 当前完整 PATH：
echo %PATH%
echo.

echo PATH 长度检查：
set "path_test=%PATH%"
set path_length=0
:loop
if defined path_test (
    set "path_test=!path_test:~1!"
    set /a path_length+=1
    goto loop
)
echo PATH 变量长度：!path_length! 字符

if !path_length! gtr 2047 (
    echo ⚠️ 警告：PATH 变量过长！Windows 可能截断了部分路径
    echo 建议：清理不必要的 PATH 条目
)
echo.

echo 🔍 MySQL 相关 PATH 条目：
echo ----------------------------------------
for %%p in ("%PATH:;=";"%") do (
    echo %%~p | findstr /i mysql >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 找到：%%~p
        if exist "%%~p\mysql.exe" (
            echo    👍 mysql.exe 存在
        ) else (
            echo    ❌ mysql.exe 不存在
        )
    )
)
echo.

echo 🔍 系统环境变量检查：
echo ----------------------------------------
for /f "tokens=*" %%i in ('reg query "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do (
    echo %%i | findstr /i mysql >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 系统 PATH 中有 MySQL 路径
    )
)

echo 🔍 用户环境变量检查：
echo ----------------------------------------
for /f "tokens=*" %%i in ('reg query "HKEY_CURRENT_USER\Environment" /v Path 2^>nul') do (
    echo %%i | findstr /i mysql >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 用户 PATH 中有 MySQL 路径
    )
)
echo.

echo 🔍 搜索 MySQL 安装：
echo ----------------------------------------
set "found_mysql="
for %%d in (C D E F) do (
    if exist "%%d:\" (
        echo 检查驱动器 %%d:
        for /d %%p in ("%%d:\Program Files\MySQL\MySQL Server*") do (
            if exist "%%p\bin\mysql.exe" (
                echo    ✅ 找到：%%p\bin\mysql.exe
                set "found_mysql=%%p\bin"
                "%%p\bin\mysql.exe" --version 2>nul
                if not errorlevel 1 (
                    echo       👍 版本检查通过
                ) else (
                    echo       ❌ 版本检查失败
                )
            )
        )
        for /d %%p in ("%%d:\Program Files (x86)\MySQL\MySQL Server*") do (
            if exist "%%p\bin\mysql.exe" (
                echo    ✅ 找到：%%p\bin\mysql.exe
                set "found_mysql=%%p\bin"
            )
        )
    )
)

REM 检查其他位置
for %%p in ("C:\MySQL\bin" "C:\xampp\mysql\bin" "C:\wamp64\bin\mysql\mysql8.0.31\bin" "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin") do (
    if exist "%%~p\mysql.exe" (
        echo ✅ 找到：%%~p\mysql.exe
        set "found_mysql=%%~p"
    )
)
echo.

echo 🔍 MySQL 服务状态：
echo ----------------------------------------
sc query mysql 2>nul | findstr "STATE" >nul
if not errorlevel 1 (
    sc query mysql | findstr "STATE"
) else (
    sc query mysql80 2>nul | findstr "STATE" >nul
    if not errorlevel 1 (
        sc query mysql80 | findstr "STATE"
    ) else (
        echo ❌ 未找到 MySQL 服务
    )
)
echo.

echo 📊 诊断结果总结：
echo ========================================
mysql --version >nul 2>&1
if not errorlevel 1 (
    echo ✅ MySQL 命令可用
    mysql --version
) else (
    echo ❌ MySQL 命令不可用
    
    if defined found_mysql (
        echo 💡 建议解决方案：
        echo    1. 重启电脑（让环境变量生效）
        echo    2. 使用管理员权限运行命令行
        echo    3. 清理 PATH 变量（如果过长）
        echo    4. 运行 mysql_quick_fix.bat 使用直接路径
        echo.
        echo 🚀 或者现在就使用完整路径测试：
        echo "!found_mysql!\mysql.exe" --version
        "!found_mysql!\mysql.exe" --version
    ) else (
        echo ❌ 未找到 MySQL 安装，请重新安装 MySQL
    )
)

echo.
echo 📝 如需帮助，请将此诊断报告截图发送给技术支持
pause