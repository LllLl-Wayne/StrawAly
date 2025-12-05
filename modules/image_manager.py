"""
图片存储与管理模块
负责草莓生长照片的存储、管理和处理
"""
import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List, Dict, Tuple
import logging
from PIL import Image, ExifTags
from config import Config

logger = logging.getLogger(__name__)

class ImageManager:
    """图片管理器"""
    
    def __init__(self):
        """初始化图片管理器"""
        self.storage_path = Config.IMAGE_STORAGE_PATH
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
        self.max_image_size = (1920, 1920)  # 最大图片尺寸
        self.thumbnail_size = (300, 300)    # 缩略图尺寸
        
        # 确保存储目录存在
        os.makedirs(self.storage_path, exist_ok=True)
        os.makedirs(os.path.join(self.storage_path, 'thumbnails'), exist_ok=True)
    
    def validate_image_file(self, file_path: str) -> bool:
        """
        验证图片文件是否有效
        
        Args:
            file_path: 图片文件路径
        
        Returns:
            是否为有效的图片文件
        """
        try:
            # 检查文件是否存在
            if not os.path.exists(file_path):
                logger.warning(f"图片文件不存在: {file_path}")
                return False
            
            # 检查文件大小（不能为空）
            if os.path.getsize(file_path) == 0:
                logger.warning(f"图片文件为空: {file_path}")
                return False
            
            # 检查文件扩展名
            _, ext = os.path.splitext(file_path.lower())
            if ext not in self.allowed_extensions:
                logger.warning(f"不支持的图片格式: {ext}")
                return False
            
            # 尝试打开图片验证格式
            try:
                with Image.open(file_path) as img:
                    img.verify()
                return True
            except Exception as img_error:
                # 如果PIL验证失败，尝试更宽松的验证
                logger.warning(f"PIL图片验证失败: {img_error}")
                
                # 检查文件头是否像图片文件
                with open(file_path, 'rb') as f:
                    header = f.read(16)
                    
                # 检查常见图片格式的文件头
                if (header.startswith(b'\xff\xd8\xff') or  # JPEG
                    header.startswith(b'\x89PNG\r\n\x1a\n') or  # PNG
                    header.startswith(b'BM') or  # BMP
                    header.startswith(b'GIF87a') or header.startswith(b'GIF89a') or  # GIF
                    (header.startswith(b'RIFF') and b'WEBP' in header)):  # WebP
                    logger.info(f"通过文件头验证的图片文件: {file_path}")
                    return True
                
                logger.error(f"图片文件验证失败，无法识别格式: {file_path}")
                return False
            
        except Exception as e:
            logger.error(f"图片文件验证失败: {e}")
            return False
    
    def generate_image_filename(self, strawberry_id: int, original_filename: str = None) -> str:
        """
        生成图片文件名
        
        Args:
            strawberry_id: 草莓ID
            original_filename: 原始文件名
        
        Returns:
            新的文件名
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_id = str(uuid.uuid4()).replace('-', '')[:8].upper()
        
        # 获取文件扩展名
        if original_filename:
            _, ext = os.path.splitext(original_filename.lower())
            if ext not in self.allowed_extensions:
                ext = '.jpg'  # 默认扩展名
        else:
            ext = '.jpg'
        
        filename = f"strawberry_{strawberry_id}_{timestamp}_{random_id}{ext}"
        return filename
    
    def save_image(self, source_path: str, strawberry_id: int, 
                   resize: bool = True, create_thumbnail: bool = True) -> Optional[str]:
        """
        保存图片文件
        
        Args:
            source_path: 源图片路径
            strawberry_id: 草莓ID
            resize: 是否调整图片大小
            create_thumbnail: 是否创建缩略图
        
        Returns:
            保存后的图片路径，失败返回None
        """
        try:
            # 验证源文件
            if not self.validate_image_file(source_path):
                return None
            
            # 生成新文件名
            original_filename = os.path.basename(source_path)
            new_filename = self.generate_image_filename(strawberry_id, original_filename)
            dest_path = os.path.join(self.storage_path, new_filename)
            
            # 处理图片
            with Image.open(source_path) as img:
                # 修正图片方向（基于EXIF数据）
                img = self._fix_image_orientation(img)
                
                # 调整图片大小
                if resize and (img.width > self.max_image_size[0] or img.height > self.max_image_size[1]):
                    img.thumbnail(self.max_image_size, Image.Resampling.LANCZOS)
                    logger.info(f"图片已调整大小: {img.size}")
                
                # 保存图片
                img.save(dest_path, quality=85, optimize=True)
                
                # 创建缩略图
                if create_thumbnail:
                    self._create_thumbnail(img, new_filename)
            
            logger.info(f"图片保存成功: {dest_path}")
            return dest_path
            
        except Exception as e:
            logger.error(f"保存图片失败: {e}")
            return None
    
    def copy_image(self, source_path: str, strawberry_id: int) -> Optional[str]:
        """
        复制图片文件（不进行处理）
        
        Args:
            source_path: 源图片路径
            strawberry_id: 草莓ID
        
        Returns:
            复制后的图片路径，失败返回None
        """
        try:
            # 验证源文件
            if not self.validate_image_file(source_path):
                return None
            
            # 生成新文件名
            original_filename = os.path.basename(source_path)
            new_filename = self.generate_image_filename(strawberry_id, original_filename)
            dest_path = os.path.join(self.storage_path, new_filename)
            
            # 复制文件
            shutil.copy2(source_path, dest_path)
            
            logger.info(f"图片复制成功: {dest_path}")
            return dest_path
            
        except Exception as e:
            logger.error(f"复制图片失败: {e}")
            return None
    
    def _fix_image_orientation(self, img: Image.Image) -> Image.Image:
        """
        根据EXIF信息修正图片方向
        
        Args:
            img: PIL图片对象
        
        Returns:
            修正后的图片对象
        """
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            
            exif = img._getexif()
            if exif is not None:
                orientation_value = exif.get(orientation)
                if orientation_value == 3:
                    img = img.rotate(180, expand=True)
                elif orientation_value == 6:
                    img = img.rotate(270, expand=True)
                elif orientation_value == 8:
                    img = img.rotate(90, expand=True)
        
        except (AttributeError, KeyError, TypeError):
            # 没有EXIF信息或无法读取，跳过
            pass
        
        return img
    
    def _create_thumbnail(self, img: Image.Image, filename: str) -> Optional[str]:
        """
        创建缩略图
        
        Args:
            img: PIL图片对象
            filename: 文件名
        
        Returns:
            缩略图路径，失败返回None
        """
        try:
            # 创建缩略图
            thumbnail = img.copy()
            thumbnail.thumbnail(self.thumbnail_size, Image.Resampling.LANCZOS)
            
            # 保存缩略图
            thumbnail_path = os.path.join(self.storage_path, 'thumbnails', filename)
            thumbnail.save(thumbnail_path, quality=75, optimize=True)
            
            logger.info(f"缩略图创建成功: {thumbnail_path}")
            return thumbnail_path
            
        except Exception as e:
            logger.error(f"创建缩略图失败: {e}")
            return None
    
    def get_image_info(self, image_path: str) -> Optional[Dict]:
        """
        获取图片信息
        
        Args:
            image_path: 图片路径
        
        Returns:
            图片信息字典
        """
        try:
            if not os.path.exists(image_path):
                return None
            
            stat = os.stat(image_path)
            
            with Image.open(image_path) as img:
                info = {
                    'path': image_path,
                    'filename': os.path.basename(image_path),
                    'size_bytes': stat.st_size,
                    'created_time': datetime.fromtimestamp(stat.st_ctime),
                    'modified_time': datetime.fromtimestamp(stat.st_mtime),
                    'width': img.width,
                    'height': img.height,
                    'format': img.format,
                    'mode': img.mode
                }
                
                # 尝试获取EXIF信息
                try:
                    exif = img._getexif()
                    if exif:
                        info['has_exif'] = True
                        # 可以在这里添加更多EXIF信息的解析
                    else:
                        info['has_exif'] = False
                except:
                    info['has_exif'] = False
                
                return info
                
        except Exception as e:
            logger.error(f"获取图片信息失败: {e}")
            return None
    
    def delete_image(self, image_path: str, delete_thumbnail: bool = True) -> bool:
        """
        删除图片文件
        
        Args:
            image_path: 图片路径
            delete_thumbnail: 是否同时删除缩略图
        
        Returns:
            是否删除成功
        """
        try:
            success = True
            
            # 删除主图片
            if os.path.exists(image_path):
                os.remove(image_path)
                logger.info(f"图片删除成功: {image_path}")
            else:
                logger.warning(f"图片文件不存在: {image_path}")
                success = False
            
            # 删除缩略图
            if delete_thumbnail:
                filename = os.path.basename(image_path)
                thumbnail_path = os.path.join(self.storage_path, 'thumbnails', filename)
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)
                    logger.info(f"缩略图删除成功: {thumbnail_path}")
            
            return success
            
        except Exception as e:
            logger.error(f"删除图片失败: {e}")
            return False
    
    def get_thumbnail_path(self, image_path: str) -> Optional[str]:
        """
        获取缩略图路径
        
        Args:
            image_path: 原图片路径
        
        Returns:
            缩略图路径，如果不存在返回None
        """
        try:
            filename = os.path.basename(image_path)
            thumbnail_path = os.path.join(self.storage_path, 'thumbnails', filename)
            
            if os.path.exists(thumbnail_path):
                return thumbnail_path
            else:
                return None
                
        except Exception as e:
            logger.error(f"获取缩略图路径失败: {e}")
            return None
    
    def list_images(self, strawberry_id: int = None) -> List[str]:
        """
        列出图片文件
        
        Args:
            strawberry_id: 草莓ID，如果提供则只返回该草莓的图片
        
        Returns:
            图片路径列表
        """
        try:
            images = []
            
            for filename in os.listdir(self.storage_path):
                if filename.lower().endswith(tuple(self.allowed_extensions)):
                    if strawberry_id is None:
                        images.append(os.path.join(self.storage_path, filename))
                    elif f"strawberry_{strawberry_id}_" in filename:
                        images.append(os.path.join(self.storage_path, filename))
            
            images.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            return images
            
        except Exception as e:
            logger.error(f"列出图片失败: {e}")
            return []
    
    def cleanup_orphaned_images(self, valid_image_paths: List[str]) -> int:
        """
        清理孤立的图片文件（数据库中不存在记录的图片）
        
        Args:
            valid_image_paths: 数据库中有效的图片路径列表
        
        Returns:
            删除的文件数量
        """
        try:
            deleted_count = 0
            all_images = self.list_images()
            
            for image_path in all_images:
                if image_path not in valid_image_paths:
                    if self.delete_image(image_path):
                        deleted_count += 1
            
            logger.info(f"清理完成，删除了 {deleted_count} 个孤立图片文件")
            return deleted_count
            
        except Exception as e:
            logger.error(f"清理孤立图片失败: {e}")
            return 0

# 全局图片管理器实例
image_manager = ImageManager()