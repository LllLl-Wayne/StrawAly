# 草莓生长溯源系统 - 数据库配置指南

## 📋 目录

1. [系统要求](#系统要求)
2. [MySQL 安装与配置](#mysql-安装与配置)
3. [数据库创建](#数据库创建)
4. [环境变量配置](#环境变量配置)
5. [数据库连接测试](#数据库连接测试)
6. [数据库优化建议](#数据库优化建议)
7. [备份与恢复](#备份与恢复)
8. [常见问题解决](#常见问题解决)

---

## 🔧 系统要求

### 软件要求
- **MySQL**: 5.7+ 或 **MariaDB**: 10.3+
- **Python**: 3.8+
- **操作系统**: Windows 10+, Linux, macOS

### 硬件要求
- **内存**: 最小 4GB，推荐 8GB+
- **存储**: 最小 10GB 可用空间
- **处理器**: 双核以上

---

## 🗄️ MySQL 安装与配置

### Windows 安装步骤

#### 1. 下载 MySQL
```bash
# 访问官网下载 MySQL Community Server
https://dev.mysql.com/downloads/mysql/
# 推荐版本：MySQL 8.0 LTS
```

#### 2. 安装配置
```bash
# 运行安装程序，选择以下配置：
# - Server Configuration Type: Development Computer
# - Authentication Method: Use Strong Password Encryption
# - 设置 root 密码（请记住此密码）
```

#### 3. 环境变量配置
```bash
# 将 MySQL bin 目录添加到 PATH：
# C:\Program Files\MySQL\MySQL Server 8.0\bin
```

### Linux 安装步骤

#### Ubuntu/Debian
```bash
# 更新包列表
sudo apt update

# 安装 MySQL Server
sudo apt install mysql-server

# 安全配置
sudo mysql_secure_installation
```

#### CentOS/RHEL
```bash
# 安装 MySQL
sudo yum install mysql-server

# 或者使用 dnf (较新版本)
sudo dnf install mysql-server

# 启动服务
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### macOS 安装步骤
```bash
# 使用 Homebrew 安装
brew install mysql

# 启动服务
brew services start mysql
```

---

## 🏗️ 数据库创建

### 方法一：使用命令行

#### 1. 连接到 MySQL
```bash
# 使用 root 用户连接
mysql -u root -p
# 输入密码
```

#### 2. 创建数据库和用户
```sql
-- 创建数据库
CREATE DATABASE strawberry_trace 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（推荐）
CREATE USER 'strawberry_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON strawberry_trace.* TO 'strawberry_user'@'localhost';
FLUSH PRIVILEGES;

-- 查看创建结果
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'strawberry_user';
```

#### 3. 执行建表脚本
```bash
# 在项目根目录执行
mysql -u strawberry_user -p strawberry_trace < database_schema.sql
```

### 方法二：使用 Python 脚本自动化

创建自动化安装脚本：

```python
# database_setup.py
import mysql.connector
from mysql.connector import Error
import os

def setup_database():
    """自动创建数据库和表"""
    try:
        # 连接到 MySQL (无指定数据库)
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password=input('请输入 MySQL root 密码: ')
        )
        
        cursor = connection.cursor()
        
        # 读取并执行 SQL 脚本
        with open('database_schema.sql', 'r', encoding='utf-8') as file:
            sql_script = file.read()
        
        # 分割并执行每个语句
        statements = sql_script.split(';')
        for statement in statements:
            if statement.strip():
                cursor.execute(statement)
        
        connection.commit()
        print("✅ 数据库创建成功！")
        
    except Error as e:
        print(f"❌ 数据库创建失败: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    setup_database()
```

---

## ⚙️ 环境变量配置

### 1. 创建 .env 文件
在项目根目录创建 `.env` 文件：

```bash
# .env 文件内容示例

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=strawberry_user
DB_PASSWORD=your_secure_password
DB_NAME=strawberry_trace

# 文件存储路径
IMAGE_STORAGE_PATH=./storage/images
QR_CODE_PATH=./storage/qr_codes

# 其他配置
MAX_RECORDS_PER_STRAWBERRY=10
```

### 2. 环境变量说明

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `DB_HOST` | 否 | localhost | 数据库主机地址 |
| `DB_PORT` | 否 | 3306 | 数据库端口 |
| `DB_USER` | **是** | - | 数据库用户名 |
| `DB_PASSWORD` | **是** | - | 数据库密码 |
| `DB_NAME` | 否 | strawberry_trace | 数据库名称 |
| `IMAGE_STORAGE_PATH` | 否 | ./images | 图片存储路径 |
| `QR_CODE_PATH` | 否 | ./qr_codes | 二维码存储路径 |

### 3. 安全注意事项
```bash
# 确保 .env 文件不被 Git 跟踪
echo ".env" >> .gitignore

# 设置文件权限（Linux/macOS）
chmod 600 .env
```

---

## 🔍 数据库连接测试

### 使用项目提供的测试工具

```bash
# 运行数据库连接测试
python verify_system.py
```

### 手动测试连接

```python
# test_connection.py
from modules.database import db_manager

def test_database_connection():
    """测试数据库连接"""
    try:
        if db_manager.test_connection():
            print("✅ 数据库连接成功！")
            
            # 测试查询
            result = db_manager.execute_query("SELECT COUNT(*) as count FROM strawberries")
            print(f"📊 当前草莓数量: {result[0]['count'] if result else 0}")
            
        else:
            print("❌ 数据库连接失败！")
            
    except Exception as e:
        print(f"❌ 连接测试出错: {e}")

if __name__ == "__main__":
    test_database_connection()
```

---

## 🚀 数据库优化建议

### 1. 索引优化
```sql
-- 查看索引使用情况
SHOW INDEX FROM strawberries;
SHOW INDEX FROM strawberry_records;

-- 分析查询性能
EXPLAIN SELECT * FROM strawberry_records WHERE strawberry_id = 1;
```

### 2. 配置优化 (my.cnf 或 my.ini)
```ini
[mysqld]
# 基础配置
default-storage-engine=InnoDB
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 性能优化
innodb_buffer_pool_size=256M  # 调整为可用内存的 70-80%
innodb_file_per_table=1
innodb_flush_log_at_trx_commit=2

# 连接设置
max_connections=100
wait_timeout=600

# 日志设置
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2
```

### 3. 定期维护
```sql
-- 分析表
ANALYZE TABLE strawberries, strawberry_records;

-- 优化表
OPTIMIZE TABLE strawberries, strawberry_records;

-- 检查表
CHECK TABLE strawberries, strawberry_records;
```

---

## 💾 备份与恢复

### 1. 备份策略

#### 完整备份
```bash
# 备份整个数据库
mysqldump -u strawberry_user -p strawberry_trace > backup_$(date +%Y%m%d).sql

# 备份包含存储过程和触发器
mysqldump -u strawberry_user -p --routines --triggers strawberry_trace > backup_full_$(date +%Y%m%d).sql
```

#### 增量备份
```bash
# 启用二进制日志（在 my.cnf 中配置）
log-bin=mysql-bin
expire_logs_days=7

# 备份二进制日志
mysqlbinlog mysql-bin.000001 > incremental_backup.sql
```

### 2. 恢复数据
```bash
# 恢复完整备份
mysql -u strawberry_user -p strawberry_trace < backup_20241201.sql

# 恢复到特定时间点
mysql -u strawberry_user -p strawberry_trace < backup_20241201.sql
mysql -u strawberry_user -p strawberry_trace < incremental_backup.sql
```

### 3. 自动化备份脚本

```bash
#!/bin/bash
# backup_script.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="strawberry_trace"
DB_USER="strawberry_user"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "备份完成: backup_$DATE.sql.gz"
```

---

## 🛠️ 常见问题解决

### 1. 连接问题

#### 问题：无法连接到数据库
```bash
# 检查 MySQL 服务状态
# Windows
net start mysql

# Linux
sudo systemctl status mysql
sudo systemctl start mysql

# macOS
brew services list | grep mysql
```

#### 问题：密码错误
```sql
-- 重置密码
ALTER USER 'strawberry_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 2. 权限问题

#### 问题：访问被拒绝
```sql
-- 检查用户权限
SHOW GRANTS FOR 'strawberry_user'@'localhost';

-- 重新授权
GRANT ALL PRIVILEGES ON strawberry_trace.* TO 'strawberry_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 字符集问题

#### 问题：中文乱码
```sql
-- 检查字符集
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- 修改字符集
ALTER DATABASE strawberry_trace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 性能问题

#### 问题：查询速度慢
```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 分析慢查询
SHOW PROCESSLIST;
EXPLAIN SELECT * FROM strawberry_records WHERE strawberry_id = 1;
```

### 5. 存储空间问题

#### 问题：磁盘空间不足
```sql
-- 检查表大小
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "size_mb"
FROM information_schema.tables
WHERE table_schema = 'strawberry_trace';

-- 清理旧数据
DELETE FROM strawberry_records WHERE recorded_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

---

## 📞 技术支持

### 获取帮助
- 📧 邮件支持：support@example.com
- 📱 QQ群：123456789
- 🌐 官方文档：https://docs.example.com

### 日志位置
- **应用日志**：`./strawberry_trace.log`
- **MySQL 错误日志**：`/var/log/mysql/error.log`
- **慢查询日志**：`/var/log/mysql/slow.log`

---

## 📋 检查清单

安装完成后，请确认以下项目：

- [ ] MySQL 服务正常运行
- [ ] 数据库 `strawberry_trace` 创建成功
- [ ] 用户 `strawberry_user` 权限配置正确
- [ ] 所有表和视图创建成功
- [ ] `.env` 文件配置正确
- [ ] 存储目录创建并有写入权限
- [ ] 数据库连接测试通过
- [ ] 备份策略已设置

---

*最后更新时间：2024-12-01*
*版本：v1.0.0*