#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================="
echo "草莓生长溯源系统 - 一键部署脚本"
echo -e "===================================================${NC}"
echo ""

# 创建日志文件
LOG_FILE="setup_log.txt"
echo "部署开始时间: $(date)" > $LOG_FILE

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}[警告] 非root用户运行，某些操作可能需要权限${NC}"
  echo "[警告] 非root用户运行" >> $LOG_FILE
fi

echo "正在检查系统环境..."
echo ""

# 检查Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        echo -e "${RED}[错误] Python版本过低! 请安装Python 3.8或更高版本。${NC}"
        echo "[错误] Python版本过低" >> $LOG_FILE
        exit 1
    else
        echo -e "${GREEN}[√] Python环境检查通过 (版本: $PYTHON_VERSION)${NC}"
        echo "[√] Python环境检查通过 (版本: $PYTHON_VERSION)" >> $LOG_FILE
        PYTHON_CMD="python3"
    fi
else
    if command -v python &> /dev/null; then
        PYTHON_VERSION=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
        
        if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
            echo -e "${RED}[错误] Python版本过低! 请安装Python 3.8或更高版本。${NC}"
            echo "[错误] Python版本过低" >> $LOG_FILE
            exit 1
        else
            echo -e "${GREEN}[√] Python环境检查通过 (版本: $PYTHON_VERSION)${NC}"
            echo "[√] Python环境检查通过 (版本: $PYTHON_VERSION)" >> $LOG_FILE
            PYTHON_CMD="python"
        fi
    else
        echo -e "${RED}[错误] 未检测到Python! 请安装Python 3.8或更高版本。${NC}"
        echo -e "您可以从 https://www.python.org/downloads/ 下载Python。"
        echo "[错误] 未检测到Python" >> $LOG_FILE
        exit 1
    fi
fi

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}[错误] Node.js版本过低! 请安装Node.js 18或更高版本。${NC}"
        echo "[错误] Node.js版本过低" >> $LOG_FILE
        exit 1
    else
        echo -e "${GREEN}[√] Node.js环境检查通过 (版本: $(node -v))${NC}"
        echo "[√] Node.js环境检查通过 (版本: $(node -v))" >> $LOG_FILE
    fi
else
    echo -e "${RED}[错误] 未检测到Node.js! 请安装Node.js 18或更高版本。${NC}"
    echo -e "您可以从 https://nodejs.org/ 下载Node.js。"
    echo "[错误] 未检测到Node.js" >> $LOG_FILE
    exit 1
fi

# 检查MySQL
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}[√] MySQL环境检查通过${NC}"
    echo "[√] MySQL环境检查通过" >> $LOG_FILE
    USE_DOCKER=0
else
    echo -e "${YELLOW}[警告] 未检测到MySQL命令行工具。将尝试使用Docker部署MySQL。${NC}"
    echo "[警告] 未检测到MySQL命令行工具" >> $LOG_FILE
    
    # 检查Docker
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}[√] 检测到Docker，将使用Docker部署MySQL${NC}"
        echo "[√] 检测到Docker" >> $LOG_FILE
        USE_DOCKER=1
    else
        echo -e "${YELLOW}[警告] 未检测到Docker。如需使用MySQL，请手动安装MySQL或Docker。${NC}"
        echo -e "您可以从 https://www.mysql.com/downloads/ 下载MySQL。"
        echo -e "或从 https://www.docker.com/products/docker-desktop/ 下载Docker。"
        echo "[警告] 未检测到Docker" >> $LOG_FILE
        USE_DOCKER=0
    fi
fi

echo ""
echo "环境检查完成，开始部署..."
echo ""

# 创建Python虚拟环境
echo "正在创建Python虚拟环境..."
if [ -d ".venv" ]; then
    echo "检测到已存在的虚拟环境，跳过创建步骤。"
else
    $PYTHON_CMD -m venv .venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 创建虚拟环境失败！${NC}"
        echo "[错误] 创建虚拟环境失败" >> $LOG_FILE
        exit 1
    fi
    echo -e "${GREEN}[√] 虚拟环境创建成功${NC}"
    echo "[√] 虚拟环境创建成功" >> $LOG_FILE
fi

# 激活虚拟环境并安装依赖
echo "正在安装Python依赖..."
source .venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 激活虚拟环境失败！${NC}"
    echo "[错误] 激活虚拟环境失败" >> $LOG_FILE
    exit 1
fi

pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 安装Python依赖失败！${NC}"
    echo "[错误] 安装Python依赖失败" >> $LOG_FILE
    exit 1
fi
echo -e "${GREEN}[√] Python依赖安装成功${NC}"
echo "[√] Python依赖安装成功" >> $LOG_FILE

# 配置环境文件
echo "正在配置环境文件..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}[√] 已创建.env配置文件，请根据需要修改配置${NC}"
    echo "[√] 已创建.env配置文件" >> $LOG_FILE
else
    echo "检测到已存在的.env文件，跳过创建步骤。"
fi

# 设置数据库
echo "正在设置数据库..."
if [ $USE_DOCKER -eq 1 ]; then
    echo "使用Docker启动MySQL..."
    docker-compose up -d
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 启动Docker MySQL失败！${NC}"
        echo "[错误] 启动Docker MySQL失败" >> $LOG_FILE
        exit 1
    fi
    echo -e "${GREEN}[√] Docker MySQL启动成功${NC}"
    echo "[√] Docker MySQL启动成功" >> $LOG_FILE
    
    # 等待MySQL启动
    echo "等待MySQL服务启动..."
    sleep 10
    
    # 运行数据库设置脚本
    $PYTHON_CMD setup_database.py
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 数据库设置失败！${NC}"
        echo "[错误] 数据库设置失败" >> $LOG_FILE
        exit 1
    fi
else
    echo "运行数据库设置脚本..."
    $PYTHON_CMD setup_database.py
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}[警告] 数据库设置可能未完成，请检查MySQL配置。${NC}"
        echo "[警告] 数据库设置可能未完成" >> $LOG_FILE
    else
        echo -e "${GREEN}[√] 数据库设置成功${NC}"
        echo "[√] 数据库设置成功" >> $LOG_FILE
    fi
fi

# 安装前端依赖
echo "正在安装前端依赖..."
cd strawberry-nextjs
if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
    echo -e "${GREEN}[√] 已创建前端环境配置文件${NC}"
    echo "[√] 已创建前端环境配置文件" >> ../$LOG_FILE
else
    echo "检测到已存在的.env.local文件，跳过创建步骤。"
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 安装前端依赖失败！${NC}"
    echo "[错误] 安装前端依赖失败" >> ../$LOG_FILE
    cd ..
    exit 1
fi
echo -e "${GREEN}[√] 前端依赖安装成功${NC}"
echo "[√] 前端依赖安装成功" >> ../$LOG_FILE

# 构建前端
echo "正在构建前端..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 前端构建失败！${NC}"
    echo "[错误] 前端构建失败" >> ../$LOG_FILE
    cd ..
    exit 1
fi
echo -e "${GREEN}[√] 前端构建成功${NC}"
echo "[√] 前端构建成功" >> ../$LOG_FILE
cd ..

echo ""
echo -e "${GREEN}==================================================="
echo "部署完成！您现在可以："
echo ""
echo "1. 启动后端服务：python web_server.py"
echo "2. 启动前端服务：cd strawberry-nextjs && npm run start"
echo ""
echo "或者使用以下脚本："
echo "- ./start_web.sh：启动Web服务"
echo -e "===================================================${NC}"
echo ""

# 创建启动脚本
echo "正在创建启动脚本..."
cat > start_web.sh << 'EOF'
#!/bin/bash
echo "正在启动Web服务..."
source .venv/bin/activate
python web_server.py &
cd strawberry-nextjs
npm run start &
echo "Web服务已启动！请访问 http://localhost:3000"
EOF

chmod +x start_web.sh
echo -e "${GREEN}[√] 已创建Web启动脚本 start_web.sh${NC}"
echo "[√] 已创建Web启动脚本" >> $LOG_FILE

echo "部署结束时间: $(date)" >> $LOG_FILE
echo "日志已保存至 $LOG_FILE"
