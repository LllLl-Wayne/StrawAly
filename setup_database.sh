#!/bin/bash

# 草莓生长溯源系统 - 快速数据库配置脚本 (Linux/macOS)

set -e  # 遇到错误立即退出

echo "🍓 草莓生长溯源系统 - 快速数据库配置"
echo "================================================"

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装 Python 3.8+"
    echo "📥 Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "📥 CentOS/RHEL: sudo yum install python3 python3-pip"
    echo "📥 macOS: brew install python3"
    exit 1
fi

echo "✅ Python3 已安装: $(python3 --version)"

# 检查 MySQL 是否可用
if ! command -v mysql &> /dev/null; then
    echo "❌ 未找到 MySQL 客户端"
    echo "💡 请安装 MySQL 或 MariaDB："
    echo "📥 Ubuntu/Debian: sudo apt install mysql-server mysql-client"
    echo "📥 CentOS/RHEL: sudo yum install mysql-server mysql"
    echo "📥 macOS: brew install mysql"
    exit 1
fi

echo "✅ MySQL 客户端已安装: $(mysql --version)"

# 检查是否有 pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ 未找到 pip3，请安装 pip"
    exit 1
fi

# 安装 Python 依赖
echo ""
echo "📦 安装 Python 依赖包..."
pip3 install mysql-connector-python python-dotenv

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 检查 MySQL 服务状态
echo ""
echo "🔍 检查 MySQL 服务状态..."

# 不同系统的 MySQL 服务检查
if command -v systemctl &> /dev/null; then
    # SystemD 系统 (大多数现代 Linux)
    if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld || systemctl is-active --quiet mariadb; then
        echo "✅ MySQL 服务正在运行"
    else
        echo "⚠️ MySQL 服务未运行，尝试启动..."
        if systemctl is-enabled --quiet mysql; then
            sudo systemctl start mysql
        elif systemctl is-enabled --quiet mysqld; then
            sudo systemctl start mysqld
        elif systemctl is-enabled --quiet mariadb; then
            sudo systemctl start mariadb
        else
            echo "❌ 无法启动 MySQL 服务，请手动启动"
            exit 1
        fi
    fi
elif command -v service &> /dev/null; then
    # SysV init 系统
    if service mysql status &> /dev/null; then
        echo "✅ MySQL 服务正在运行"
    else
        echo "⚠️ MySQL 服务未运行，尝试启动..."
        sudo service mysql start
    fi
elif command -v brew &> /dev/null; then
    # macOS with Homebrew
    if brew services list | grep mysql | grep started &> /dev/null; then
        echo "✅ MySQL 服务正在运行"
    else
        echo "⚠️ MySQL 服务未运行，尝试启动..."
        brew services start mysql
    fi
else
    echo "⚠️ 无法检测 MySQL 服务状态，请确保 MySQL 正在运行"
fi

# 运行数据库设置脚本
echo ""
echo "🔧 启动数据库配置向导..."
python3 setup_database.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 配置完成！"
    echo "📋 接下来可以运行："
    echo "   python3 verify_system.py  - 验证系统配置"
    echo "   python3 main.py           - 启动应用"
else
    echo "❌ 数据库配置失败"
    exit 1
fi

echo ""
echo "📝 提示："
echo "   - 配置信息已保存到 .env 文件"
echo "   - 数据库表已自动创建"
echo "   - 图片和二维码存储目录已创建"