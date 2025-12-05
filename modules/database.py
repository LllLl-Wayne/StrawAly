"""
数据库连接管理模块
负责MySQL数据库的连接、关闭和基础操作
"""
import mysql.connector
from mysql.connector import Error
from contextlib import contextmanager
import logging
from config import Config

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        """初始化数据库管理器"""
        self.config = {
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
            'database': Config.DB_NAME,
            'charset': 'utf8mb4',
            'autocommit': False
        }
        self.connection = None
    
    def connect(self):
        """建立数据库连接"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                logger.info("成功连接到MySQL数据库")
                # 设置会话时区为本地时区，避免TIMESTAMP隐式转换导致的时间偏差
                try:
                    from datetime import datetime
                    local_offset = datetime.now().astimezone().utcoffset()
                    if local_offset is not None:
                        total_seconds = int(local_offset.total_seconds())
                        sign = '+' if total_seconds >= 0 else '-'
                        abs_seconds = abs(total_seconds)
                        hours = abs_seconds // 3600
                        minutes = (abs_seconds % 3600) // 60
                        offset_str = f"{sign}{hours:02d}:{minutes:02d}"
                        cur = self.connection.cursor()
                        cur.execute("SET time_zone = %s", (offset_str,))
                        cur.close()
                        logger.info(f"会话时区已设置为: {offset_str}")
                except Exception as tz_err:
                    logger.warning(f"设置会话时区失败: {tz_err}")
                return True
        except Error as e:
            logger.error(f"数据库连接失败: {e}")
            return False
        return False
    
    def disconnect(self):
        """关闭数据库连接"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("数据库连接已关闭")
    
    def is_connected(self):
        """检查数据库连接状态"""
        return self.connection and self.connection.is_connected()
    
    @contextmanager
    def get_cursor(self, dictionary=True):
        """获取游标的上下文管理器"""
        if not self.is_connected():
            if not self.connect():
                raise Exception("无法建立数据库连接")
        
        cursor = self.connection.cursor(dictionary=dictionary)
        try:
            yield cursor
        except Exception as e:
            self.connection.rollback()
            logger.error(f"数据库操作失败，已回滚: {e}")
            raise
        finally:
            cursor.close()
    
    def execute_query(self, query, params=None, fetch_one=False, fetch_all=True):
        """执行查询操作"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())
                
                if fetch_one:
                    return cursor.fetchone()
                elif fetch_all:
                    return cursor.fetchall()
                else:
                    return cursor.rowcount
        except Error as e:
            logger.error(f"查询执行失败: {e}")
            raise
    
    def execute_insert(self, query, params=None):
        """执行插入操作"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())
                self.connection.commit()
                return cursor.lastrowid
        except Error as e:
            logger.error(f"插入操作失败: {e}")
            raise
    
    def execute_update(self, query, params=None):
        """执行更新操作"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())
                self.connection.commit()
                return cursor.rowcount
        except Error as e:
            logger.error(f"更新操作失败: {e}")
            raise
    
    def execute_delete(self, query, params=None):
        """执行删除操作"""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(query, params or ())
                self.connection.commit()
                return cursor.rowcount
        except Error as e:
            logger.error(f"删除操作失败: {e}")
            raise
    
    def execute_many(self, query, params_list):
        """批量执行操作"""
        try:
            with self.get_cursor() as cursor:
                cursor.executemany(query, params_list)
                self.connection.commit()
                return cursor.rowcount
        except Error as e:
            logger.error(f"批量操作失败: {e}")
            raise
    
    def test_connection(self):
        """测试数据库连接"""
        try:
            if self.connect():
                result = self.execute_query("SELECT VERSION()", fetch_one=True)
                logger.info(f"数据库版本: {result}")
                return True
        except Exception as e:
            logger.error(f"数据库连接测试失败: {e}")
        return False

# 全局数据库管理器实例
db_manager = DatabaseManager()