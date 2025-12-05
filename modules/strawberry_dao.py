"""
草莓数据访问对象 (DAO)
提供对草莓相关数据的高级操作接口
"""
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import logging
from .database import db_manager

logger = logging.getLogger(__name__)

class StrawberryDAO:
    """草莓数据访问对象"""
    
    def __init__(self):
        """初始化DAO"""
        self.db = db_manager
    
    def create_strawberry(self, qr_code: str, qr_code_path: Optional[str] = None, notes: Optional[str] = None) -> Optional[int]:
        """
        创建新的草莓记录
        
        Args:
            qr_code: 二维码内容
            qr_code_path: 二维码图片路径
            notes: 备注信息
        
        Returns:
            草莓ID，失败返回None
        """
        try:
            query = """
                INSERT INTO strawberries (qr_code, qr_code_path, notes)
                VALUES (%s, %s, %s)
            """
            strawberry_id = self.db.execute_insert(query, (qr_code, qr_code_path, notes))
            logger.info(f"成功创建草莓记录，ID: {strawberry_id}")
            return strawberry_id
        except Exception as e:
            logger.error(f"创建草莓记录失败: {e}")
            return None
    
    def get_strawberry_by_id(self, strawberry_id: int) -> Optional[Dict]:
        """根据ID获取草莓信息"""
        try:
            query = "SELECT * FROM strawberries WHERE id = %s"
            result = self.db.execute_query(query, (strawberry_id,), fetch_one=True)  # type: ignore
            return result if result else None  # type: ignore
        except Exception as e:
            logger.error(f"获取草莓信息失败: {e}")
            return None
    
    def get_strawberry_by_qr_code(self, qr_code: str) -> Optional[Dict]:
        """根据二维码获取草莓信息"""
        try:
            query = "SELECT * FROM strawberries WHERE qr_code = %s"
            result = self.db.execute_query(query, (qr_code,), fetch_one=True)  # type: ignore
            return result if result else None  # type: ignore
        except Exception as e:
            logger.error(f"根据二维码获取草莓信息失败: {e}")
            return None
    
    def get_all_strawberries(self, status: Optional[str] = None) -> List[Dict]:
        """获取所有草莓信息"""
        try:
            if status:
                query = "SELECT * FROM strawberries WHERE status = %s ORDER BY created_at DESC"
                result = self.db.execute_query(query, (status,))  # type: ignore
                return result if result else []  # type: ignore
            else:
                query = "SELECT * FROM strawberries ORDER BY created_at DESC"
                result = self.db.execute_query(query)  # type: ignore
                return result if result else []  # type: ignore
        except Exception as e:
            logger.error(f"获取草莓列表失败: {e}")
            return []
    
    def update_strawberry_status(self, strawberry_id: int, status: str) -> bool:
        """更新草莓状态"""
        try:
            query = "UPDATE strawberries SET status = %s WHERE id = %s"
            affected_rows = self.db.execute_update(query, (status, strawberry_id))
            return affected_rows > 0
        except Exception as e:
            logger.error(f"更新草莓状态失败: {e}")
            return False
            
    def update_qr_code_path(self, strawberry_id: int, qr_code_path: str) -> bool:
        """更新草莓二维码图片路径"""
        try:
            query = "UPDATE strawberries SET qr_code_path = %s WHERE id = %s"
            affected_rows = self.db.execute_update(query, (qr_code_path, strawberry_id))
            logger.info(f"更新草莓二维码路径成功，ID: {strawberry_id}, 新路径: {qr_code_path}")
            return affected_rows > 0
        except Exception as e:
            logger.error(f"更新草莓二维码路径失败: {e}")
            return False
    
    def add_growth_record(self, strawberry_id: int, image_path: str, 
                         ai_description: Optional[str] = None, growth_stage: Optional[str] = None,
                         health_status: str = 'healthy', size_estimate: Optional[str] = None,
                         color_description: Optional[str] = None, recorded_at: Optional[datetime] = None) -> Optional[int]:
        """
        添加生长记录
        
        Args:
            strawberry_id: 草莓ID
            image_path: 图片路径
            ai_description: AI描述
            growth_stage: 生长阶段
            health_status: 健康状态
            size_estimate: 大小估计
            color_description: 颜色描述
            recorded_at: 记录时间
        
        Returns:
            记录ID，失败返回None
        """
        try:
            if recorded_at is None:
                recorded_at = datetime.now()
            
            query = """
                INSERT INTO strawberry_records 
                (strawberry_id, image_path, ai_description, growth_stage, 
                 health_status, size_estimate, color_description, recorded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            record_id = self.db.execute_insert(query, (
                strawberry_id, image_path, ai_description, growth_stage,
                health_status, size_estimate, color_description, recorded_at
            ))
            logger.info(f"成功添加生长记录，ID: {record_id}")
            return record_id
        except Exception as e:
            logger.error(f"添加生长记录失败: {e}")
            return None
    
    def get_strawberry_records(self, strawberry_id: int, limit: int = 10) -> List[Dict]:
        """获取草莓的生长记录"""
        try:
            query = """
                SELECT * FROM strawberry_records 
                WHERE strawberry_id = %s 
                ORDER BY recorded_at DESC 
                LIMIT %s
            """
            result = self.db.execute_query(query, (strawberry_id, limit))  # type: ignore
            return result if result else []  # type: ignore
        except Exception as e:
            logger.error(f"获取生长记录失败: {e}")
            return []
    
    def get_latest_record(self, strawberry_id: int) -> Optional[Dict]:
        """获取草莓的最新记录"""
        try:
            query = """
                SELECT * FROM strawberry_records 
                WHERE strawberry_id = %s 
                ORDER BY recorded_at DESC 
                LIMIT 1
            """
            result = self.db.execute_query(query, (strawberry_id,), fetch_one=True)  # type: ignore
            return result if result else None  # type: ignore
        except Exception as e:
            logger.error(f"获取最新记录失败: {e}")
            return None
    
    def get_strawberry_with_latest_record(self, strawberry_id: Optional[int] = None) -> List[Dict]:
        """获取草莓及其最新记录"""
        try:
            if strawberry_id:
                query = "SELECT * FROM strawberry_latest_view WHERE id = %s"
                result = self.db.execute_query(query, (strawberry_id,))  # type: ignore
                return result if result else []  # type: ignore
            else:
                query = "SELECT * FROM strawberry_latest_view ORDER BY strawberry_created_at DESC"
                result = self.db.execute_query(query)  # type: ignore
                return result if result else []  # type: ignore
        except Exception as e:
            logger.error(f"获取草莓和最新记录失败: {e}")
            return []
    
    def delete_strawberry(self, strawberry_id: int) -> bool:
        """删除草莓（会级联删除相关记录）"""
        try:
            query = "DELETE FROM strawberries WHERE id = %s"
            affected_rows = self.db.execute_delete(query, (strawberry_id,))
            return affected_rows > 0
        except Exception as e:
            logger.error(f"删除草莓失败: {e}")
            return False
            
    def delete_record(self, record_id: int) -> bool:
        """删除单条观察记录"""
        try:
            query = "DELETE FROM strawberry_records WHERE id = %s"
            affected_rows = self.db.execute_delete(query, (record_id,))
            return affected_rows > 0
        except Exception as e:
            logger.error(f"删除记录失败: {e}")
            return False
            
    def get_record_by_id(self, record_id: int) -> Optional[Dict]:
        """根据ID获取单条记录"""
        try:
            query = "SELECT * FROM strawberry_records WHERE id = %s"
            result = self.db.execute_query(query, (record_id,), fetch_one=True)
            return result if result else None
        except Exception as e:
            logger.error(f"获取记录失败: {e}")
            return None
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        try:
            stats = {}
            
            # 草莓总数
            result = self.db.execute_query(
                "SELECT COUNT(*) as total FROM strawberries", 
                fetch_one=True
            )
            stats['total_strawberries'] = result['total'] if result else 0  # type: ignore
            
            # 各状态草莓数量
            status_result = self.db.execute_query("""
                SELECT status, COUNT(*) as count 
                FROM strawberries 
                GROUP BY status
            """)
            stats['status_counts'] = {row['status']: row['count'] for row in status_result}  # type: ignore
            
            # 记录总数
            record_result = self.db.execute_query(
                "SELECT COUNT(*) as total FROM strawberry_records", 
                fetch_one=True
            )
            stats['total_records'] = record_result['total'] if record_result else 0  # type: ignore
            
            return stats
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}

# 全局DAO实例
strawberry_dao = StrawberryDAO()