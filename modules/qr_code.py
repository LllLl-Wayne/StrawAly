"""
二维码生成与管理模块
负责生成唯一的二维码标识和二维码图片
"""
import qrcode
from qrcode import constants
import os
import uuid
from datetime import datetime
from typing import Optional, Tuple, List, Dict
import logging
from PIL import Image
from config import Config

logger = logging.getLogger(__name__)

class QRCodeManager:
    """二维码管理器"""
    
    def __init__(self):
        """初始化二维码管理器"""
        self.storage_path = Config.QR_CODE_PATH
        self.qr_size = Config.QR_CODE_SIZE
        self.qr_border = Config.QR_CODE_BORDER
        
        # 确保存储目录存在
        os.makedirs(self.storage_path, exist_ok=True)
    
    def generate_unique_code(self, prefix: str = "SB") -> str:
        """
        生成唯一的二维码内容
        
        Args:
            prefix: 前缀，默认为"SB"（Strawberry的缩写）
        
        Returns:
            唯一的二维码内容字符串
        """
        # 生成格式: 前缀_年月日_时分秒_随机UUID前8位
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_id = str(uuid.uuid4()).replace('-', '')[:8].upper()
        
        qr_content = f"{prefix}_{timestamp}_{random_id}"
        logger.info(f"生成二维码内容: {qr_content}")
        return qr_content
    
    def create_qr_code(self, content: str, filename: Optional[str] = None) -> Optional[str]:
        """
        创建二维码图片
        
        Args:
            content: 二维码内容
            filename: 文件名，如果不提供则自动生成
        
        Returns:
            二维码图片的完整路径，失败返回None
        """
        try:
            # 创建二维码对象
            qr = qrcode.QRCode(
                version=1,  # 控制二维码的大小
                error_correction=constants.ERROR_CORRECT_L,
                box_size=self.qr_size,
                border=self.qr_border,
            )
            
            # 添加数据
            qr.add_data(content)
            qr.make(fit=True)
            
            # 创建二维码图片
            img = qr.make_image(fill_color="black", back_color="white")
            
            # 生成文件名
            if not filename:
                # 从内容中提取安全的文件名
                safe_content = content.replace('/', '_').replace('\\', '_').replace(':', '_')
                filename = f"qr_{safe_content}.png"
            
            # 确保文件名以.png结尾
            if not filename.lower().endswith('.png'):
                filename += '.png'
            
            # 完整路径
            full_path = os.path.join(self.storage_path, filename)
            
            # 保存图片
            with open(full_path, 'wb') as f:
                img.save(f, 'PNG')
            
            logger.info(f"二维码图片保存成功: {full_path}")
            return full_path
            
        except Exception as e:
            logger.error(f"创建二维码失败: {e}")
            return None
    
    def generate_strawberry_qr(self, custom_prefix: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
        """
        为草莓生成唯一二维码和图片
        
        Args:
            custom_prefix: 自定义前缀
        
        Returns:
            (二维码内容, 二维码图片路径) 的元组，失败返回(None, None)
        """
        try:
            # 生成唯一内容
            prefix = custom_prefix if custom_prefix else "SB"
            qr_content = self.generate_unique_code(prefix)
            
            # 创建二维码图片
            qr_image_path = self.create_qr_code(qr_content)
            
            if qr_image_path:
                return qr_content, qr_image_path
            else:
                return None, None
                
        except Exception as e:
            logger.error(f"生成草莓二维码失败: {e}")
            return None, None
    
    def validate_qr_code(self, qr_content: str) -> bool:
        """
        验证二维码内容格式是否正确
        
        Args:
            qr_content: 二维码内容
        
        Returns:
            是否为有效格式
        """
        try:
            # 检查基本格式: 前缀_日期_时间_随机码
            parts = qr_content.split('_')
            if len(parts) < 4:
                return False
            
            # 检查日期格式 (YYYYMMDD)
            date_part = parts[1]
            if len(date_part) != 8 or not date_part.isdigit():
                return False
            
            # 检查时间格式 (HHMMSS)
            time_part = parts[2]
            if len(time_part) != 6 or not time_part.isdigit():
                return False
            
            # 检查随机码格式 (8位字母数字)
            random_part = parts[3]
            if len(random_part) != 8 or not random_part.isalnum():
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"验证二维码格式失败: {e}")
            return False
    
    def create_batch_qr_codes(self, count: int, prefix: str = "SB") -> List[Tuple[str, str]]:
        """
        批量生成二维码
        
        Args:
            count: 生成数量
            prefix: 前缀
        
        Returns:
            [(二维码内容, 图片路径), ...] 的列表
        """
        results = []
        
        for i in range(count):
            try:
                qr_content, qr_path = self.generate_strawberry_qr(prefix)
                if qr_content and qr_path:
                    results.append((qr_content, qr_path))
                    logger.info(f"批量生成进度: {i+1}/{count}")
                else:
                    logger.warning(f"第{i+1}个二维码生成失败")
                    
            except Exception as e:
                logger.error(f"批量生成第{i+1}个二维码时出错: {e}")
        
        logger.info(f"批量生成完成，成功: {len(results)}/{count}")
        return results
    
    def get_qr_code_info(self, qr_path: str) -> Optional[Dict]:
        """
        获取二维码文件信息
        
        Args:
            qr_path: 二维码文件路径
        
        Returns:
            文件信息字典
        """
        try:
            if not os.path.exists(qr_path):
                return None
            
            stat = os.stat(qr_path)
            with Image.open(qr_path) as img:
                width, height = img.size
            
            return {
                'path': qr_path,
                'filename': os.path.basename(qr_path),
                'size_bytes': stat.st_size,
                'created_time': datetime.fromtimestamp(stat.st_ctime),
                'modified_time': datetime.fromtimestamp(stat.st_mtime),
                'image_width': width,
                'image_height': height
            }
            
        except Exception as e:
            logger.error(f"获取二维码信息失败: {e}")
            return None
    
    def delete_qr_code(self, qr_path: str) -> bool:
        """
        删除二维码文件
        
        Args:
            qr_path: 二维码文件路径
        
        Returns:
            是否删除成功
        """
        try:
            if os.path.exists(qr_path):
                os.remove(qr_path)
                logger.info(f"二维码文件删除成功: {qr_path}")
                return True
            else:
                logger.warning(f"二维码文件不存在: {qr_path}")
                return False
                
        except Exception as e:
            logger.error(f"删除二维码文件失败: {e}")
            return False

# 全局二维码管理器实例
qr_manager = QRCodeManager()