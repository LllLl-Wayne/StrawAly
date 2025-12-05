"""
数据查询与展示模块
提供草莓溯源数据的查询、统计和展示功能
"""
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging
from modules.strawberry_dao import strawberry_dao
from modules.image_manager import image_manager
from modules.qr_code import qr_manager

logger = logging.getLogger(__name__)

class StrawberryTraceService:
    """草莓溯源服务类"""
    
    def __init__(self):
        """初始化服务"""
        self.dao = strawberry_dao
        self.image_manager = image_manager
        self.qr_manager = qr_manager
    
    def create_new_strawberry(self, notes: Optional[str] = None, custom_prefix: Optional[str] = None) -> Optional[Dict]:
        """
        创建新的草莓记录
        
        Args:
            notes: 备注信息
            custom_prefix: 自定义二维码前缀
        
        Returns:
            创建的草莓信息字典，失败返回None
        """
        try:
            # 生成二维码
            qr_content, qr_image_path = self.qr_manager.generate_strawberry_qr(custom_prefix)
            if not qr_content or not qr_image_path:
                logger.error("生成二维码失败")
                return None
            
            # 创建草莓记录
            strawberry_id = self.dao.create_strawberry(qr_content, qr_image_path, notes)
            if not strawberry_id:
                # 如果创建失败，清理已生成的二维码
                self.qr_manager.delete_qr_code(qr_image_path)
                logger.error("创建草莓记录失败")
                return None
            
            # 重命名二维码文件，添加草莓ID
            new_filename = f"qr_{qr_content}_id{strawberry_id}.png"
            new_qr_path = os.path.join(os.path.dirname(qr_image_path), new_filename)
            try:
                os.rename(qr_image_path, new_qr_path)
                # 更新数据库中的二维码路径
                self.dao.update_qr_code_path(strawberry_id, new_qr_path)
                qr_image_path = new_qr_path
                logger.info(f"二维码文件已重命名: {new_qr_path}")
            except Exception as e:
                logger.warning(f"重命名二维码文件失败: {e}")
            
            # 获取完整信息
            strawberry_info = self.dao.get_strawberry_by_id(strawberry_id)
            logger.info(f"成功创建草莓记录，ID: {strawberry_id}")
            return strawberry_info
            
        except Exception as e:
            logger.error(f"创建草莓记录失败: {e}")
            return None
    
    def add_observation_record(self, strawberry_id: int, image_path: str, 
                             ai_description: Optional[str] = None, growth_stage: Optional[str] = None,
                             health_status: str = 'healthy', size_estimate: Optional[str] = None,
                             color_description: Optional[str] = None) -> Optional[Dict]:
        """
        添加观察记录
        
        Args:
            strawberry_id: 草莓ID
            image_path: 图片路径
            ai_description: AI生成的描述
            growth_stage: 生长阶段
            health_status: 健康状态
            size_estimate: 大小估计
            color_description: 颜色描述
        
        Returns:
            记录信息字典，失败返回None
        """
        try:
            # 验证草莓是否存在
            strawberry = self.dao.get_strawberry_by_id(strawberry_id)
            if not strawberry:
                logger.error(f"草莓不存在，ID: {strawberry_id}")
                return None
            
            # 保存图片
            saved_image_path = self.image_manager.save_image(image_path, strawberry_id)
            if not saved_image_path:
                logger.error("保存图片失败")
                return None
            
            # 添加记录
            record_id = self.dao.add_growth_record(
                strawberry_id, saved_image_path, ai_description, 
                growth_stage, health_status, size_estimate, color_description
            )
            
            if not record_id:
                # 如果添加记录失败，清理已保存的图片
                self.image_manager.delete_image(saved_image_path)
                logger.error("添加观察记录失败")
                return None
            
            # 获取完整记录信息
            records = self.dao.get_strawberry_records(strawberry_id, 1)
            if records:
                logger.info(f"成功添加观察记录，ID: {record_id}")
                return records[0]
            
            return None
            
        except Exception as e:
            logger.error(f"添加观察记录失败: {e}")
            return None
    
    def get_strawberry_full_info(self, strawberry_id: int) -> Optional[Dict]:
        """
        获取草莓的完整信息，包括基本信息和所有记录
        
        Args:
            strawberry_id: 草莓ID
        
        Returns:
            完整信息字典
        """
        try:
            # 获取基本信息
            strawberry = self.dao.get_strawberry_by_id(strawberry_id)
            if not strawberry:
                return None
            
            # 获取所有记录
            records = self.dao.get_strawberry_records(strawberry_id)
            
            # 为每个记录添加图片信息
            for record in records:
                if record.get('image_path'):
                    # 获取图片信息
                    image_info = self.image_manager.get_image_info(record['image_path'])
                    if image_info:
                        record['image_info'] = image_info
                    
                    # 获取缩略图路径
                    thumbnail_path = self.image_manager.get_thumbnail_path(record['image_path'])
                    if thumbnail_path:
                        record['thumbnail_path'] = thumbnail_path
            
            # 组合完整信息
            full_info = {
                'strawberry': strawberry,
                'records': records,
                'record_count': len(records)
            }
            
            return full_info
            
        except Exception as e:
            logger.error(f"获取草莓完整信息失败: {e}")
            return None
    
    def search_strawberry_by_qr(self, qr_content: str) -> Optional[Dict]:
        """
        通过二维码内容搜索草莓
        
        Args:
            qr_content: 二维码内容
        
        Returns:
            草莓完整信息
        """
        try:
            strawberry = self.dao.get_strawberry_by_qr_code(qr_content)
            if not strawberry:
                return None
            
            return self.get_strawberry_full_info(strawberry['id'])
            
        except Exception as e:
            logger.error(f"通过二维码搜索草莓失败: {e}")
            return None
    
    def get_strawberry_list(self, status: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """
        获取草莓列表及其最新记录
        
        Args:
            status: 草莓状态过滤
            limit: 限制返回数量
        
        Returns:
            草莓列表
        """
        try:
            strawberries = self.dao.get_strawberry_with_latest_record()
            
            # 状态过滤
            if status:
                strawberries = [s for s in strawberries if s.get('strawberry_status') == status]
            
            # 数量限制
            if limit:
                strawberries = strawberries[:limit]
            
            # 为每个草莓添加额外信息
            for strawberry in strawberries:
                if strawberry.get('latest_image_path'):
                    thumbnail_path = self.image_manager.get_thumbnail_path(strawberry['latest_image_path'])
                    if thumbnail_path:
                        strawberry['latest_thumbnail_path'] = thumbnail_path
            
            return strawberries
            
        except Exception as e:
            logger.error(f"获取草莓列表失败: {e}")
            return []
    
    def get_growth_timeline(self, strawberry_id: int) -> List[Dict]:
        """
        获取草莓生长时间线
        
        Args:
            strawberry_id: 草莓ID
        
        Returns:
            时间线记录列表
        """
        try:
            records = self.dao.get_strawberry_records(strawberry_id)
            
            timeline = []
            for record in records:
                timeline_item = {
                    'id': record['id'],
                    'recorded_at': record['recorded_at'],
                    'growth_stage': record.get('growth_stage'),
                    'health_status': record.get('health_status'),
                    'ai_description': record.get('ai_description'),
                    'image_path': record['image_path']
                }
                
                # 添加缩略图
                thumbnail_path = self.image_manager.get_thumbnail_path(record['image_path'])
                if thumbnail_path:
                    timeline_item['thumbnail_path'] = thumbnail_path
                
                timeline.append(timeline_item)
            
            return timeline
            
        except Exception as e:
            logger.error(f"获取生长时间线失败: {e}")
            return []
    
    def get_statistics_report(self) -> Dict:
        """
        获取统计报告
        
        Returns:
            统计信息字典
        """
        try:
            # 基础统计
            stats = self.dao.get_statistics()
            
            # 添加更多统计信息
            now = datetime.now()
            
            # 今日新增
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_strawberries = self.dao.db.execute_query(
                "SELECT COUNT(*) as count FROM strawberries WHERE created_at >= %s",
                (today_start,), fetch_one=True
            )
            stats['today_new_strawberries'] = today_strawberries['count'] if today_strawberries else 0  # type: ignore
            
            # 本周新增
            week_start = today_start - timedelta(days=now.weekday())
            week_strawberries = self.dao.db.execute_query(
                "SELECT COUNT(*) as count FROM strawberries WHERE created_at >= %s",
                (week_start,), fetch_one=True
            )
            stats['week_new_strawberries'] = week_strawberries['count'] if week_strawberries else 0  # type: ignore
            
            # 生长阶段统计
            stage_stats = self.dao.db.execute_query("""
                SELECT growth_stage, COUNT(*) as count
                FROM strawberry_records sr
                JOIN (
                    SELECT strawberry_id, MAX(recorded_at) as max_recorded_at
                    FROM strawberry_records
                    GROUP BY strawberry_id
                ) latest ON sr.strawberry_id = latest.strawberry_id 
                         AND sr.recorded_at = latest.max_recorded_at
                WHERE growth_stage IS NOT NULL
                GROUP BY growth_stage
            """)
            stats['growth_stage_counts'] = {row['growth_stage']: row['count'] for row in stage_stats}  # type: ignore
            
            # 健康状态统计
            health_stats = self.dao.db.execute_query("""
                SELECT health_status, COUNT(*) as count
                FROM strawberry_records sr
                JOIN (
                    SELECT strawberry_id, MAX(recorded_at) as max_recorded_at
                    FROM strawberry_records
                    GROUP BY strawberry_id
                ) latest ON sr.strawberry_id = latest.strawberry_id 
                         AND sr.recorded_at = latest.max_recorded_at
                GROUP BY health_status
            """)
            stats['health_status_counts'] = {row['health_status']: row['count'] for row in health_stats}  # type: ignore
            
            return stats
            
        except Exception as e:
            logger.error(f"获取统计报告失败: {e}")
            return {}
    
    def export_strawberry_data(self, strawberry_id: int, format: str = 'json') -> Optional[str]:
        """
        导出草莓数据
        
        Args:
            strawberry_id: 草莓ID
            format: 导出格式 ('json' 或 'dict')
        
        Returns:
            导出的数据，失败返回None
        """
        try:
            full_info = self.get_strawberry_full_info(strawberry_id)
            if not full_info:
                return None
            
            # 转换datetime对象为字符串
            def convert_datetime(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: convert_datetime(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_datetime(item) for item in obj]
                else:
                    return obj
            
            converted_data = convert_datetime(full_info)
            
            if format.lower() == 'json':
                return json.dumps(converted_data, ensure_ascii=False, indent=2)
            else:
                return converted_data  # type: ignore
                
        except Exception as e:
            logger.error(f"导出草莓数据失败: {e}")
            return None
    
    def delete_strawberry_with_cleanup(self, strawberry_id: int) -> bool:
        """
        删除草莓及其相关文件
        
        Args:
            strawberry_id: 草莓ID
        
        Returns:
            是否删除成功
        """
        try:
            # 获取草莓信息
            strawberry = self.dao.get_strawberry_by_id(strawberry_id)
            if not strawberry:
                logger.warning(f"草莓不存在，ID: {strawberry_id}")
                return False
            
            # 获取所有记录
            records = self.dao.get_strawberry_records(strawberry_id)
            
            # 删除数据库记录（会自动级联删除相关记录）
            if not self.dao.delete_strawberry(strawberry_id):
                logger.error("删除数据库记录失败")
                return False
            
            # 删除二维码文件
            if strawberry.get('qr_code_path'):
                self.qr_manager.delete_qr_code(strawberry['qr_code_path'])
            
            # 删除图片文件
            for record in records:
                if record.get('image_path'):
                    self.image_manager.delete_image(record['image_path'])
            
            logger.info(f"成功删除草莓及相关文件，ID: {strawberry_id}")
            return True
            
        except Exception as e:
            logger.error(f"删除草莓失败: {e}")
            return False
    
    def validate_system_integrity(self) -> Dict:
        """
        验证系统完整性
        
        Returns:
            验证结果字典
        """
        try:
            result = {
                'valid': True,
                'issues': [],
                'statistics': {}
            }
            
            # 检查数据库连接
            if not self.dao.db.test_connection():
                result['valid'] = False
                result['issues'].append("数据库连接失败")
            
            # 检查孤立文件
            all_images = self.image_manager.list_images()
            all_records = self.dao.db.execute_query("SELECT image_path FROM strawberry_records")  # type: ignore
            valid_image_paths = [record['image_path'] for record in all_records if record.get('image_path')]  # type: ignore
            
            orphaned_images = [img for img in all_images if img not in valid_image_paths]
            if orphaned_images:
                result['issues'].append(f"发现 {len(orphaned_images)} 个孤立图片文件")
                result['statistics']['orphaned_images'] = len(orphaned_images)
            
            # 检查缺失文件
            missing_images = [path for path in valid_image_paths if not os.path.exists(path)]
            if missing_images:
                result['valid'] = False
                result['issues'].append(f"发现 {len(missing_images)} 个缺失的图片文件")
                result['statistics']['missing_images'] = len(missing_images)
            
            return result
            
        except Exception as e:
            logger.error(f"验证系统完整性失败: {e}")
            return {'valid': False, 'issues': [f"验证过程出错: {e}"], 'statistics': {}}

# 全局服务实例
trace_service = StrawberryTraceService()