#!/bin/bash
# 草莓生长溯源系统 - Web服务器启动脚本 (Linux/macOS)

echo "🍓 草莓生长溯源系统 - Web服务器启动"
echo "================================================"

# 检查Python是否可用
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python 3.8+"
    exit 1
fi

echo "✅ Python环境检查通过"

# 检查虚拟环境
if [ -f "venv/bin/activate" ]; then
    echo "🔧 检测到虚拟环境，正在激活..."
    source venv/bin/activate
    echo "✅ 虚拟环境已激活"
else
    echo "⚠️  未检测到虚拟环境，使用系统Python"
fi

# 检查必要依赖
echo "📦 检查Web依赖包..."
python3 -c "import flask" &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Flask未安装，正在安装Web依赖..."
    pip3 install Flask Flask-CORS
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo "✅ 依赖检查完成"

# 设置环境变量
export WEB_HOST=${WEB_HOST:-127.0.0.1}
export WEB_PORT=${WEB_PORT:-5000}
export WEB_DEBUG=${WEB_DEBUG:-False}

# 检查端口是否被占用
echo "🔍 检查端口 $WEB_PORT 是否可用..."
if netstat -tuln 2>/dev/null | grep -q ":$WEB_PORT "; then
    echo "⚠️  端口 $WEB_PORT 已被占用，尝试使用端口 5001"
    export WEB_PORT=5001
    if netstat -tuln 2>/dev/null | grep -q ":5001 "; then
        echo "❌ 端口 5001 也被占用，请手动指定端口"
        exit 1
    fi
fi

echo "✅ 端口 $WEB_PORT 可用"

# 启动Web服务器
echo ""
echo "🚀 启动Web服务器..."
echo "   访问地址: http://$WEB_HOST:$WEB_PORT"
echo "   按 Ctrl+C 停止服务器"
echo "================================================"
echo ""

python3 web_server.py

echo ""
echo "👋 Web服务器已停止"