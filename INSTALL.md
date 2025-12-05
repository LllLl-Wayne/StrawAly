# 草莓生长溯源系统 - 安装和配置指南

## 系统要求

### 硬件要求
- CPU: 双核以上处理器
- 内存: 4GB RAM以上
- 存储: 5GB可用磁盘空间
- 网络: 可选（用于远程数据库连接）

### 软件要求
- **Python**: 3.7或更高版本
- **MySQL**: 5.7或8.0版本
- **操作系统**: Windows 10/11, Linux (Ubuntu 18.04+), macOS 10.14+

## 详细安装步骤

### 第一步：准备Python环境

#### Windows系统
1. 从[Python官网](https://www.python.org/downloads/)下载Python 3.7+
2. 安装时勾选"Add Python to PATH"
3. 验证安装：
   ```cmd
   python --version
   pip --version
   ```

#### Linux系统
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# CentOS/RHEL
sudo yum install python3 python3-pip
```

#### macOS系统
```bash
# 使用Homebrew
brew install python3
```

### 第二步：安装MySQL数据库

#### Windows系统
1. 下载[MySQL Installer](https://dev.mysql.com/downloads/installer/)
2. 选择"Developer Default"安装类型
3. 设置root密码
4. 确保MySQL服务已启动

#### Linux系统
```bash
# Ubuntu/Debian
sudo apt install mysql-server
sudo mysql_secure_installation

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

#### macOS系统
```bash
# 使用Homebrew
brew install mysql
brew services start mysql
```

### 第三步：创建数据库和用户

连接到MySQL并创建项目数据库：

```sql
-- 连接到MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE strawberry_trace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（推荐）
CREATE USER 'strawberry_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON strawberry_trace.* TO 'strawberry_user'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 第四步：下载和配置项目

1. **获取项目文件**（如果是从压缩包）
   ```bash
   # 解压到指定目录
   unzip strawberry_trace.zip
   cd strawberry_trace
   ```

2. **安装Python依赖**
   ```bash
   # 创建虚拟环境（推荐）
   python -m venv venv
   
   # 激活虚拟环境
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   
   # 安装依赖
   pip install -r requirements.txt
   ```

3. **创建配置文件**
   ```bash
   # 复制配置文件模板
   cp .env.example .env
   ```

4. **编辑配置文件**
   
   编辑`.env`文件，填入实际配置：
   ```env
   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=strawberry_user
   DB_PASSWORD=your_secure_password
   DB_NAME=strawberry_trace
   
   # 文件存储路径
   IMAGE_STORAGE_PATH=./images
   QR_CODE_PATH=./qr_codes
   ```

### 第五步：初始化数据库

```bash
# 导入数据库结构
mysql -u strawberry_user -p strawberry_trace < database_schema.sql
```

### 第六步：验证安装

运行测试程序验证安装：

```bash
# 运行示例程序
python examples/demo.py

# 或启动主程序
python main.py -i
```

## 配置详解

### 数据库配置选项

```env
# 数据库主机地址
DB_HOST=localhost              # 本地: localhost, 远程: IP地址

# 数据库端口
DB_PORT=3306                   # MySQL默认端口

# 数据库用户名
DB_USER=strawberry_user        # 建议使用专用用户

# 数据库密码
DB_PASSWORD=your_password      # 使用强密码

# 数据库名称
DB_NAME=strawberry_trace       # 项目数据库名
```

### 文件存储配置

```env
# 图片存储路径（相对或绝对路径）
IMAGE_STORAGE_PATH=./images    # 相对路径
# IMAGE_STORAGE_PATH=/var/data/strawberry/images  # 绝对路径

# 二维码存储路径
QR_CODE_PATH=./qr_codes
```

### 高级配置

在`config.py`中可以调整更多参数：

```python
class Config:
    # 每颗草莓最大记录数
    MAX_RECORDS_PER_STRAWBERRY = 10
    
    # 二维码配置
    QR_CODE_SIZE = 10          # 二维码块大小
    QR_CODE_BORDER = 4         # 边框大小
    
    # 图片处理配置
    MAX_IMAGE_SIZE = (1920, 1920)    # 最大图片尺寸
    THUMBNAIL_SIZE = (300, 300)      # 缩略图尺寸
```

## 部署建议

### 开发环境
- 使用SQLite作为轻量级数据库（需修改配置）
- 文件存储在项目目录下
- 启用详细日志

### 生产环境
- 使用MySQL/MariaDB作为数据库
- 文件存储在专用目录
- 配置日志轮转
- 使用反向代理（如Nginx）
- 配置SSL证书（如果需要Web访问）

### 安全配置

1. **数据库安全**
   ```sql
   -- 创建只读用户（用于查询）
   CREATE USER 'strawberry_readonly'@'localhost' IDENTIFIED BY 'readonly_password';
   GRANT SELECT ON strawberry_trace.* TO 'strawberry_readonly'@'localhost';
   ```

2. **文件权限**
   ```bash
   # Linux/macOS
   chmod 750 images/ qr_codes/
   chmod 640 .env
   ```

3. **防火墙配置**
   ```bash
   # 如果需要远程访问MySQL
   sudo ufw allow 3306/tcp
   ```

## 性能优化

### 数据库优化

1. **创建索引**（已在schema中包含）
   ```sql
   -- 额外索引建议
   CREATE INDEX idx_strawberries_created_at ON strawberries(created_at);
   CREATE INDEX idx_records_recorded_at ON strawberry_records(recorded_at);
   ```

2. **MySQL配置优化**
   ```ini
   # /etc/mysql/mysql.conf.d/mysqld.cnf
   [mysqld]
   innodb_buffer_pool_size = 256M
   query_cache_size = 64M
   max_connections = 200
   ```

### 存储优化

1. **图片压缩**
   - 自动调整图片大小
   - JPEG质量设置为85%
   - 生成缩略图减少加载时间

2. **定期清理**
   ```bash
   # 创建清理脚本
   #!/bin/bash
   # cleanup.sh
   find ./images -name "*.jpg" -mtime +365 -exec rm {} \;
   find ./qr_codes -name "*.png" -mtime +365 -exec rm {} \;
   ```

## 故障排除

### 安装问题

1. **Python包安装失败**
   ```bash
   # 升级pip
   python -m pip install --upgrade pip
   
   # 使用国内镜像源
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

2. **MySQL连接失败**
   ```bash
   # 检查MySQL状态
   sudo systemctl status mysql
   
   # 重启MySQL服务
   sudo systemctl restart mysql
   
   # 检查端口占用
   netstat -tlnp | grep 3306
   ```

3. **权限问题**
   ```bash
   # 检查目录权限
   ls -la images/ qr_codes/
   
   # 修复权限
   chmod -R 755 images/ qr_codes/
   ```

### 运行时问题

1. **图片处理错误**
   - 检查Pillow库是否正确安装
   - 验证图片格式是否支持
   - 确认存储目录可写

2. **二维码生成失败**
   - 检查qrcode库版本
   - 验证存储路径权限
   - 确认磁盘空间充足

3. **数据库连接超时**
   - 增加连接超时时间
   - 检查网络连接
   - 验证数据库服务状态

## 备份和恢复

### 数据备份

```bash
# 备份数据库
mysqldump -u strawberry_user -p strawberry_trace > backup_$(date +%Y%m%d).sql

# 备份文件
tar -czf files_backup_$(date +%Y%m%d).tar.gz images/ qr_codes/
```

### 数据恢复

```bash
# 恢复数据库
mysql -u strawberry_user -p strawberry_trace < backup_20241201.sql

# 恢复文件
tar -xzf files_backup_20241201.tar.gz
```

## 联系支持

如果遇到安装或配置问题：

1. 检查日志文件`strawberry_trace.log`
2. 查看本文档的故障排除部分
3. 提交Issue包含详细错误信息
4. 联系技术支持团队

---

安装完成后，您就可以开始使用草莓生长溯源系统了！