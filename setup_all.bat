@echo off
echo ===================================================
echo 草莓生长溯源系统 - 一键部署脚本
echo ===================================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 请以管理员权限运行此脚本！
    echo 右键点击此脚本，选择"以管理员身份运行"。
    pause
    exit /b 1
)

:: 设置颜色
color 0A

:: 创建日志文件
set LOG_FILE=setup_log.txt
echo 部署开始时间: %date% %time% > %LOG_FILE%

echo 正在检查系统环境...
echo.

:: 检查Python
python --version > nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未检测到Python! 请安装Python 3.8或更高版本。
    echo 您可以从 https://www.python.org/downloads/ 下载Python。
    echo [错误] 未检测到Python >> %LOG_FILE%
    pause
    exit /b 1
) else (
    python -c "import sys; print('检测到Python版本:', sys.version.split()[0]); sys.exit(1 if int(sys.version.split()[0].split('.')[0]) < 3 or (int(sys.version.split()[0].split('.')[0]) == 3 and int(sys.version.split()[0].split('.')[1]) < 8) else 0)"
    if %errorLevel% neq 0 (
        echo [错误] Python版本过低! 请安装Python 3.8或更高版本。
        echo [错误] Python版本过低 >> %LOG_FILE%
        pause
        exit /b 1
    )
    echo [√] Python环境检查通过
    echo [√] Python环境检查通过 >> %LOG_FILE%
)

:: 检查Node.js
node --version > nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 未检测到Node.js! 请安装Node.js 18或更高版本。
    echo 您可以从 https://nodejs.org/ 下载Node.js。
    echo [错误] 未检测到Node.js >> %LOG_FILE%
    pause
    exit /b 1
) else (
    node -e "process.exit(process.version.slice(1).split('.')[0] < 18 ? 1 : 0)"
    if %errorLevel% neq 0 (
        echo [错误] Node.js版本过低! 请安装Node.js 18或更高版本。
        echo [错误] Node.js版本过低 >> %LOG_FILE%
        pause
        exit /b 1
    )
    echo [√] Node.js环境检查通过
    echo [√] Node.js环境检查通过 >> %LOG_FILE%
)

:: 检查MySQL
mysql --version > nul 2>&1
if %errorLevel% neq 0 (
    echo [警告] 未检测到MySQL命令行工具。将尝试使用Docker部署MySQL。
    echo [警告] 未检测到MySQL命令行工具 >> %LOG_FILE%
    
    :: 检查Docker
    docker --version > nul 2>&1
    if %errorLevel% neq 0 (
        echo [警告] 未检测到Docker。如需使用MySQL，请手动安装MySQL或Docker。
        echo 您可以从 https://www.mysql.com/downloads/ 下载MySQL。
        echo 或从 https://www.docker.com/products/docker-desktop/ 下载Docker。
        echo [警告] 未检测到Docker >> %LOG_FILE%
        set USE_DOCKER=0
    ) else (
        echo [√] 检测到Docker，将使用Docker部署MySQL
        echo [√] 检测到Docker >> %LOG_FILE%
        set USE_DOCKER=1
    )
) else (
    echo [√] MySQL环境检查通过
    echo [√] MySQL环境检查通过 >> %LOG_FILE%
    set USE_DOCKER=0
)

echo.
echo 环境检查完成，开始部署...
echo.

:: 创建Python虚拟环境
echo 正在创建Python虚拟环境...
if exist .venv (
    echo 检测到已存在的虚拟环境，跳过创建步骤。
) else (
    python -m venv .venv
    if %errorLevel% neq 0 (
        echo [错误] 创建虚拟环境失败！
        echo [错误] 创建虚拟环境失败 >> %LOG_FILE%
        pause
        exit /b 1
    )
    echo [√] 虚拟环境创建成功
    echo [√] 虚拟环境创建成功 >> %LOG_FILE%
)

:: 激活虚拟环境并安装依赖
echo 正在安装Python依赖...
call .venv\Scripts\activate.bat
if %errorLevel% neq 0 (
    echo [错误] 激活虚拟环境失败！
    echo [错误] 激活虚拟环境失败 >> %LOG_FILE%
    pause
    exit /b 1
)

pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo [错误] 安装Python依赖失败！
    echo [错误] 安装Python依赖失败 >> %LOG_FILE%
    pause
    exit /b 1
)
echo [√] Python依赖安装成功
echo [√] Python依赖安装成功 >> %LOG_FILE%

:: 配置环境文件
echo 正在配置环境文件...
if not exist .env (
    copy .env.example .env
    echo [√] 已创建.env配置文件，请根据需要修改配置
    echo [√] 已创建.env配置文件 >> %LOG_FILE%
) else (
    echo 检测到已存在的.env文件，跳过创建步骤。
)

:: 设置数据库
echo 正在设置数据库...
if %USE_DOCKER% equ 1 (
    echo 使用Docker启动MySQL...
    docker-compose up -d
    if %errorLevel% neq 0 (
        echo [错误] 启动Docker MySQL失败！
        echo [错误] 启动Docker MySQL失败 >> %LOG_FILE%
        pause
        exit /b 1
    )
    echo [√] Docker MySQL启动成功
    echo [√] Docker MySQL启动成功 >> %LOG_FILE%
    
    :: 等待MySQL启动
    echo 等待MySQL服务启动...
    timeout /t 10 /nobreak > nul
    
    :: 运行数据库设置脚本
    python setup_database.py
    if %errorLevel% neq 0 (
        echo [错误] 数据库设置失败！
        echo [错误] 数据库设置失败 >> %LOG_FILE%
        pause
        exit /b 1
    )
) else (
    echo 运行数据库设置脚本...
    python setup_database.py
    if %errorLevel% neq 0 (
        echo [警告] 数据库设置可能未完成，请检查MySQL配置。
        echo [警告] 数据库设置可能未完成 >> %LOG_FILE%
    ) else (
        echo [√] 数据库设置成功
        echo [√] 数据库设置成功 >> %LOG_FILE%
    )
)

:: 安装前端依赖
echo 正在安装前端依赖...
cd strawberry-nextjs
if not exist .env.local (
    echo NEXT_PUBLIC_API_URL=http://localhost:5000/api > .env.local
    echo [√] 已创建前端环境配置文件
    echo [√] 已创建前端环境配置文件 >> ..\%LOG_FILE%
) else (
    echo 检测到已存在的.env.local文件，跳过创建步骤。
)

npm install
if %errorLevel% neq 0 (
    echo [错误] 安装前端依赖失败！
    echo [错误] 安装前端依赖失败 >> ..\%LOG_FILE%
    cd ..
    pause
    exit /b 1
)
echo [√] 前端依赖安装成功
echo [√] 前端依赖安装成功 >> ..\%LOG_FILE%

:: 构建前端
echo 正在构建前端...
npm run build
if %errorLevel% neq 0 (
    echo [错误] 前端构建失败！
    echo [错误] 前端构建失败 >> ..\%LOG_FILE%
    cd ..
    pause
    exit /b 1
)
echo [√] 前端构建成功
echo [√] 前端构建成功 >> ..\%LOG_FILE%
cd ..

echo.
echo ===================================================
echo 部署完成！您现在可以：
echo.
echo 1. 启动后端服务：python web_server.py
echo 2. 启动前端服务：cd strawberry-nextjs && npm run start
echo.
echo 或者使用以下批处理文件：
echo - start_web.bat：启动Web服务
echo ===================================================
echo.

:: 创建启动脚本
echo 正在创建启动脚本...
echo @echo off > start_web.bat
echo echo 正在启动Web服务... >> start_web.bat
echo call .venv\Scripts\activate.bat >> start_web.bat
echo start "草莓溯源系统后端" python web_server.py >> start_web.bat
echo cd strawberry-nextjs >> start_web.bat
echo start "草莓溯源系统前端" npm run start >> start_web.bat
echo echo Web服务已启动！请访问 http://localhost:3000 >> start_web.bat
echo [√] 已创建Web启动脚本 start_web.bat
echo [√] 已创建Web启动脚本 >> %LOG_FILE%

echo 部署结束时间: %date% %time% >> %LOG_FILE%
echo 日志已保存至 %LOG_FILE%

pause
