#!/usr/bin/env python3
"""
草莓生长溯源系统 - 数据库自动化设置脚本
自动创建数据库、用户和表结构
"""
from typing import Optional
import os
import sys
import mysql.connector
from mysql.connector import Error
import getpass
from pathlib import Path

class DatabaseSetup:
    """数据库设置类"""
    
    def __init__(self):
        self.connection = None  # type: ignore
        self.cursor = None  # type: ignore
        self.config = {}
    
    def get_connection_info(self):
        """获取数据库连接信息"""
        print("🔧 草莓生长溯源系统 - 数据库设置")
        print("=" * 50)
        
        # 获取 MySQL root 连接信息
        self.config['host'] = input("MySQL 主机地址 [localhost]: ").strip() or 'localhost'
        self.config['port'] = int(input("MySQL 端口 [3306]: ").strip() or '3306')
        self.config['root_user'] = input("MySQL 管理员用户名 [root]: ").strip() or 'root'
        self.config['root_password'] = getpass.getpass("MySQL 管理员密码: ")
        
        print("\n📝 配置数据库信息:")
        self.config['db_name'] = input("数据库名称 [strawberry_trace]: ").strip() or 'strawberry_trace'
        self.config['db_user'] = input("应用用户名 [strawberry_user]: ").strip() or 'strawberry_user'
        self.config['db_password'] = getpass.getpass("应用用户密码: ")
        
        if not self.config['db_password']:
            print("❌ 应用用户密码不能为空")
            return False
        
        return True
    
    def connect_to_mysql(self):
        """连接到 MySQL 服务器"""
        try:
            print("\n🔌 连接到 MySQL 服务器...")
            self.connection = mysql.connector.connect(  # type: ignore
                host=self.config['host'],
                port=self.config['port'],
                user=self.config['root_user'],
                password=self.config['root_password'],
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            self.cursor = self.connection.cursor()  # type: ignore
            print("✅ MySQL 连接成功")
            return True
        except Error as e:
            print(f"❌ MySQL 连接失败: {e}")
            return False
    
    def create_database(self):
        """创建数据库"""
        try:
            print(f"\n🗄️ 创建数据库 '{self.config['db_name']}'...")
            
            # 检查数据库是否已存在
            if self.cursor is not None:
                self.cursor.execute("SHOW DATABASES")  # type: ignore
                databases = [db[0] for db in self.cursor.fetchall()]  # type: ignore
            else:
                databases = []
            
            if self.config['db_name'] in databases:
                response = input(f"⚠️ 数据库 '{self.config['db_name']}' 已存在，是否删除并重新创建？ (y/N): ")
                if response.lower() == 'y':
                    if self.cursor is not None:
                        self.cursor.execute(f"DROP DATABASE {self.config['db_name']}")  # type: ignore
                    print(f"🗑️ 已删除现有数据库 '{self.config['db_name']}'")
                else:
                    print("📝 使用现有数据库")
                    return True
            
            # 创建数据库
            create_db_query = f"""
            CREATE DATABASE {self.config['db_name']} 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
            """
            if self.cursor is not None:
                self.cursor.execute(create_db_query)  # type: ignore
            print(f"✅ 数据库 '{self.config['db_name']}' 创建成功")
            return True
            
        except Error as e:
            print(f"❌ 创建数据库失败: {e}")
            return False
    
    def create_user(self):
        """创建应用用户"""
        try:
            print(f"\n👤 创建用户 '{self.config['db_user']}'...")
            
            # 检查用户是否已存在
            if self.cursor is not None:
                self.cursor.execute("SELECT user, host FROM mysql.user WHERE user = %s", (self.config['db_user'],))  # type: ignore
                existing_users = self.cursor.fetchall()  # type: ignore
            else:
                existing_users = []
            
            if existing_users:
                print(f"⚠️ 用户 '{self.config['db_user']}' 已存在")
                response = input("是否更新密码？ (y/N): ")
                if response.lower() == 'y':
                    if self.cursor is not None:
                        self.cursor.execute(  # type: ignore
                            f"ALTER USER '{self.config['db_user']}'@'localhost' IDENTIFIED BY %s",
                            (self.config['db_password'],)
                        )
                    print(f"🔑 用户 '{self.config['db_user']}' 密码已更新")
            else:
                # 创建新用户
                if self.cursor is not None:
                    self.cursor.execute(  # type: ignore
                        f"CREATE USER '{self.config['db_user']}'@'localhost' IDENTIFIED BY %s",
                        (self.config['db_password'],)
                    )
                print(f"✅ 用户 '{self.config['db_user']}' 创建成功")
            
            # 授权
            if self.cursor is not None:
                self.cursor.execute(  # type: ignore
                    f"GRANT ALL PRIVILEGES ON {self.config['db_name']}.* TO '{self.config['db_user']}'@'localhost'"
                )
                self.cursor.execute("FLUSH PRIVILEGES")  # type: ignore
            print(f"🔐 用户权限设置完成")
            return True
            
        except Error as e:
            print(f"❌ 创建用户失败: {e}")
            return False
    
    def execute_schema(self):
        """执行建表脚本"""
        try:
            print("\n🏗️ 创建数据表...")
            
            # 切换到目标数据库
            if self.cursor is not None:
                self.cursor.execute(f"USE {self.config['db_name']}")  # type: ignore
            
            # 读取 SQL 脚本
            schema_file = Path(__file__).parent / 'database_schema.sql'
            if not schema_file.exists():
                print(f"❌ 找不到建表脚本: {schema_file}")
                return False
            
            with open(schema_file, 'r', encoding='utf-8') as file:
                sql_content = file.read()
            
            # 分割 SQL 语句并执行
            statements = []
            current_statement = ""
            delimiter = ";"
            
            for line in sql_content.split('\n'):
                line = line.strip()
                
                # 跳过注释和空行
                if not line or line.startswith('--'):
                    continue
                
                # 处理 DELIMITER 语句
                if line.startswith('DELIMITER'):
                    delimiter = line.split()[1]
                    continue
                
                current_statement += line + "\n"
                
                # 如果语句结束
                if line.endswith(delimiter):
                    if delimiter != ";":
                        # 恢复默认分隔符
                        current_statement = current_statement.replace(delimiter, ";")
                        delimiter = ";"
                    
                    statements.append(current_statement.strip())
                    current_statement = ""
            
            # 添加最后一个语句
            if current_statement.strip():
                statements.append(current_statement.strip())
            
            # 执行所有语句
            for i, statement in enumerate(statements):
                if statement and not statement.isspace():
                    try:
                        # 跳过 USE 语句和注释
                        if statement.upper().startswith(('USE ', 'CREATE DATABASE', '--')):
                            continue
                        
                        if self.cursor is not None:
                            self.cursor.execute(statement)  # type: ignore
                        print(f"✓ 执行语句 {i+1}/{len(statements)}")
                        
                    except Error as e:
                        print(f"⚠️ 语句执行警告: {e}")
                        print(f"语句内容: {statement[:100]}...")
            
            # 提交事务
            if self.connection is not None:
                self.connection.commit()  # type: ignore
            print("✅ 数据表创建完成")
            return True
            
        except Error as e:
            print(f"❌ 执行建表脚本失败: {e}")
            return False
        except Exception as e:
            print(f"❌ 读取建表脚本失败: {e}")
            return False
    
    def create_env_file(self):
        """创建环境配置文件"""
        try:
            print("\n📝 创建环境配置文件...")
            
            env_file = Path(__file__).parent / '.env'
            
            # 检查是否已存在
            if env_file.exists():
                response = input("⚠️ .env 文件已存在，是否覆盖？ (y/N): ")
                if response.lower() != 'y':
                    print("📝 保留现有 .env 文件")
                    return True
            
            env_content = f"""# 草莓生长溯源系统环境配置
# 数据库配置
DB_HOST={self.config['host']}
DB_PORT={self.config['port']}
DB_USER={self.config['db_user']}
DB_PASSWORD={self.config['db_password']}
DB_NAME={self.config['db_name']}

# 文件存储路径
IMAGE_STORAGE_PATH=./storage/images
QR_CODE_PATH=./storage/qr_codes

# 系统配置
MAX_RECORDS_PER_STRAWBERRY=10
"""
            
            with open(env_file, 'w', encoding='utf-8') as file:
                file.write(env_content)
            
            # 设置文件权限（仅在 Unix 系统上）
            if os.name != 'nt':
                os.chmod(env_file, 0o600)
            
            print(f"✅ 环境配置文件已创建: {env_file}")
            return True
            
        except Exception as e:
            print(f"❌ 创建环境配置文件失败: {e}")
            return False
    
    def test_connection(self):
        """测试应用数据库连接"""
        try:
            print("\n🔍 测试应用数据库连接...")
            
            # 使用应用用户连接
            test_connection = mysql.connector.connect(
                host=self.config['host'],
                port=self.config['port'],
                user=self.config['db_user'],
                password=self.config['db_password'],
                database=self.config['db_name'],
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            
            test_cursor = test_connection.cursor()
            
            # 测试查询
            test_cursor.execute("SELECT COUNT(*) FROM strawberries")  # type: ignore
            result = test_cursor.fetchone()  # type: ignore
            count = result[0] if result else 0  # type: ignore
            
            test_cursor.execute("SHOW TABLES")  # type: ignore
            tables = [str(table[0]) for table in test_cursor.fetchall()]  # type: ignore
            
            test_cursor.close()
            test_connection.close()
            
            print(f"✅ 连接测试成功")
            print(f"📊 发现数据表: {', '.join(tables)}")
            print(f"📈 草莓记录数: {count}")
            return True
            
        except Error as e:
            print(f"❌ 连接测试失败: {e}")
            return False
    
    def cleanup(self):
        """清理资源"""
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()
    
    def run_setup(self):
        """运行完整的设置流程"""
        try:
            # 获取配置信息
            if not self.get_connection_info():
                return False
            
            # 连接 MySQL
            if not self.connect_to_mysql():
                return False
            
            # 创建数据库
            if not self.create_database():
                return False
            
            # 创建用户
            if not self.create_user():
                return False
            
            # 执行建表脚本
            if not self.execute_schema():
                return False
            
            # 创建环境配置文件
            if not self.create_env_file():
                return False
            
            # 测试连接
            if not self.test_connection():
                return False
            
            print("\n🎉 数据库设置完成！")
            print("\n📋 接下来的步骤:")
            print("1. 检查 .env 文件中的配置")
            print("2. 运行 python verify_system.py 验证系统")
            print("3. 运行 python main.py 启动应用")
            
            return True
            
        except KeyboardInterrupt:
            print("\n\n❌ 设置被用户中断")
            return False
        except Exception as e:
            print(f"\n❌ 设置过程出现异常: {e}")
            return False
        finally:
            self.cleanup()

def main():
    """主函数"""
    print("🍓 草莓生长溯源系统 - 数据库设置向导")
    print("=" * 60)
    
    # 检查必要的依赖
    try:
        import mysql.connector
    except ImportError:
        print("❌ 缺少必要依赖: mysql-connector-python")
        print("请运行: pip install mysql-connector-python")
        return 1
    
    # 运行设置
    setup = DatabaseSetup()
    success = setup.run_setup()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())