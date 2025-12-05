@echo off
chcp 65001 >nul
echo 🐳 草莓生长溯源系统 - Docker 数据库快速启动
echo ================================================

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Docker，请先安装 Docker Desktop
    echo 📥 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker 已安装

REM 检查 Docker Compose 是否可用
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker Compose 已安装

REM 启动 MySQL 容器
echo.
echo 🚀 启动 MySQL 数据库容器...
docker-compose up -d mysql

if errorlevel 1 (
    echo ❌ MySQL 容器启动失败
    pause
    exit /b 1
)

echo ✅ MySQL 容器启动成功

REM 等待 MySQL 完全启动
echo.
echo ⏳ 等待 MySQL 初始化完成...
timeout /t 30 /nobreak >nul

REM 检查容器健康状态
echo 🔍 检查 MySQL 健康状态...
docker-compose ps mysql

echo.
echo 📋 数据库连接信息：
echo    主机: localhost
echo    端口: 3306
echo    数据库: strawberry_trace
echo    用户名: strawberry_user
echo    密码: strawberry_pass_2024

echo.
echo 🌐 phpMyAdmin 管理界面：
echo    地址: http://localhost:8080
echo    用户名: strawberry_user
echo    密码: strawberry_pass_2024

echo.
echo 🎯 接下来的步骤：
echo 1. 创建 .env 文件并配置数据库连接信息
echo 2. 运行: python setup_database.py
echo 3. 或直接运行: python main.py

echo.
echo 💡 提示：
echo - 停止容器：docker-compose down
echo - 查看日志：docker-compose logs mysql
echo - 重启容器：docker-compose restart mysql

pause