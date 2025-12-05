@echo off
chcp 65001 >nul  
setlocal enabledelayedexpansion
echo 🔧 MySQL PATH 环境变量诊断与修复工具
echo ================================================

echo 🔍 正在进行详细的系统诊断...
echo.

REM 检查当前会话的 PATH
echo 📋 当前会话 PATH 诊断：
echo %PATH% | findstr /i mysql >nul
if not errorlevel 1 (
    echo ✅ 当前会话 PATH 中找到 MySQL 相关路径
    for %%p in ("%PATH:;=";"%") do (
        echo %%~p | findstr /i mysql >nul 2>&1
        if not errorlevel 1 (
            echo    - %%~p
            if exist "%%~p\mysql.exe" (
                echo      ✅ mysql.exe 存在
            ) else (
                echo      ❌ mysql.exe 不存在
            )
        )
    )
) else (
    echo ❌ 当前会话 PATH 中未找到 MySQL 路径
)

echo.
echo 🔍 检查系统变量 PATH：

REM 使用 PowerShell 获取系统 PATH
for /f "delims=" %%i in ('powershell -command "[Environment]::GetEnvironmentVariable('Path', 'Machine')"') do set "SYSTEM_PATH=%%i"
echo !SYSTEM_PATH! | findstr /i mysql >nul
if not errorlevel 1 (
    echo ✅ 系统 PATH 中找到 MySQL 相关路径
    echo !SYSTEM_PATH! | findstr /i mysql
) else (
    echo ❌ 系统 PATH 中未找到 MySQL 路径
)

echo.
echo 🔍 检查用户变量 PATH：
for /f "delims=" %%i in ('powershell -command "[Environment]::GetEnvironmentVariable('Path', 'User')"') do set "USER_PATH=%%i"
if defined USER_PATH (
    echo !USER_PATH! | findstr /i mysql >nul
    if not errorlevel 1 (
        echo ✅ 用户 PATH 中找到 MySQL 相关路径
        echo !USER_PATH! | findstr /i mysql
    ) else (
        echo ❌ 用户 PATH 中未找到 MySQL 路径
    )
) else (
    echo ⚠️ 用户 PATH 变量为空
)

echo.
echo 📊 PATH 变量长度检查：
set "FULL_PATH=%PATH%"
set "PATH_LENGTH=0"
:count_loop
if defined FULL_PATH (
    set "FULL_PATH=!FULL_PATH:~1!"
    set /a PATH_LENGTH+=1
    goto count_loop
)
echo PATH 变量长度: !PATH_LENGTH! 字符
if !PATH_LENGTH! gtr 2047 (
    echo ⚠️ PATH 变量过长，可能被截断！
)

echo.
echo 🔍 直接测试 MySQL 命令：
mysql --version 2>nul
if errorlevel 1 (
    echo ❌ MySQL 命令不可用
    echo 💡 可能的原因：
    echo    1. PATH 变量被截断（长度超过 2047 字符）
    echo    2. 需要重启电脑才能生效
    echo    3. 用户变量和系统变量冲突
    echo    4. MySQL 服务未启动
    echo    5. 需要管理员权限
) else (
    echo ✅ MySQL 命令可用！
    mysql --version
    echo.
    echo 🎉 MySQL 已经可以使用了！
    echo 现在可以运行 setup_database.bat
    pause
    exit /b 0
)

REM 搜索 MySQL 安装位置
echo 🔍 搜索 MySQL 安装位置...

set "FOUND_PATHS="
for %%d in (C D E F) do (
    for /d %%p in ("%%d:\Program Files\MySQL\MySQL Server*") do (
        if exist "%%p\bin\mysql.exe" (
            echo    找到: %%p\bin
            if not defined FOUND_PATHS (
                set "FOUND_PATHS=%%p\bin"
            ) else (
                set "FOUND_PATHS=!FOUND_PATHS!;%%p\bin"
            )
        )
    )
    for /d %%p in ("%%d:\Program Files (x86)\MySQL\MySQL Server*") do (
        if exist "%%p\bin\mysql.exe" (
            echo    找到: %%p\bin
            if not defined FOUND_PATHS (
                set "FOUND_PATHS=%%p\bin"
            ) else (
                set "FOUND_PATHS=!FOUND_PATHS!;%%p\bin"
            )
        )
    )
)

REM 检查其他常见位置
for %%p in ("C:\MySQL\bin" "C:\xampp\mysql\bin" "C:\wamp64\bin\mysql\mysql8.0.31\bin") do (
    if exist "%%~p\mysql.exe" (
        echo    找到: %%~p
        if not defined FOUND_PATHS (
            set "FOUND_PATHS=%%~p"
        ) else (
            set "FOUND_PATHS=!FOUND_PATHS!;%%~p"
        )
    )
)

if not defined FOUND_PATHS (
    echo ❌ 未找到 MySQL 安装，请确保 MySQL 已正确安装
    echo 📥 下载地址: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

echo.
echo 🎯 找到以下 MySQL 安装：
setlocal enabledelayedexpansion
set "counter=0"
for %%p in ("!FOUND_PATHS:;=";"%") do (
    set /a counter+=1
    echo    !counter!. %%~p
    set "path!counter!=%%~p"
)

echo.
if !counter! equ 1 (
    set "SELECTED_PATH=!path1!"
    echo 📍 自动选择: !SELECTED_PATH!
) else (
    set /p "choice=请选择要使用的 MySQL 版本 (1-!counter!): "
    set "SELECTED_PATH=!path%choice%!"
)

if not defined SELECTED_PATH (
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo 🔧 准备添加到 PATH: !SELECTED_PATH!

REM 临时测试
set "PATH=!SELECTED_PATH!;%PATH%"
"!SELECTED_PATH!\mysql.exe" --version
if errorlevel 1 (
    echo ❌ MySQL 测试失败
    pause
    exit /b 1
)

echo ✅ MySQL 测试成功!

echo.
echo 🤔 您希望如何处理？
echo    1. 仅在当前会话中添加 (临时解决)
echo    2. 永久添加到系统 PATH (推荐)
echo    3. 显示手动添加步骤
echo.
set /p "choice=请选择 (1-3): "

if "%choice%"=="1" (
    echo ✅ 已临时添加到当前会话
    echo 💡 重新打开命令行后需要重新运行此工具
    echo.
    echo 🚀 现在可以运行 setup_database.bat
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo 🔧 正在永久添加到系统 PATH...
    
    REM 使用 PowerShell 添加到系统 PATH
    powershell -Command "& {$oldPath = [Environment]::GetEnvironmentVariable('Path', 'Machine'); if ($oldPath -notlike '*!SELECTED_PATH!*') { $newPath = $oldPath + ';!SELECTED_PATH!'; [Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine'); Write-Host '✅ 已添加到系统 PATH'; } else { Write-Host '⚠️ PATH 中已存在此路径'; }}"
    
    if errorlevel 1 (
        echo ❌ 自动添加失败，可能需要管理员权限
        echo 💡 请选择选项 3 查看手动添加步骤
        pause
        exit /b 1
    )
    
    echo ✅ 成功添加到系统 PATH!
    echo 🔄 请重新打开命令行使更改生效
    echo.
    echo 🚀 然后运行 setup_database.bat
    pause
    exit /b 0
)

if "%choice%"=="3" (
    echo.
    echo 📋 手动添加 PATH 的步骤：
    echo ================================
    echo.
    echo 1. 按 Win + X，选择 "系统"
    echo 2. 点击 "高级系统设置"
    echo 3. 点击 "环境变量" 按钮
    echo 4. 在 "系统变量" 区域找到 "Path"，点击 "编辑"
    echo 5. 点击 "新建"，添加以下路径：
    echo.
    echo    !SELECTED_PATH!
    echo.
    echo 6. 点击 "确定" 保存所有对话框
    echo 7. 重新打开命令行
    echo 8. 运行 setup_database.bat
    echo.
    pause
    exit /b 0
)

echo ❌ 无效选择
pause
exit /b 1