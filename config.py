"""
草莓生长溯源项目配置文件
"""
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """项目配置类"""
    
    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_NAME = os.getenv('DB_NAME', 'strawberry_trace')
    
    # 文件存储配置
    IMAGE_STORAGE_PATH = os.getenv('IMAGE_STORAGE_PATH', './images')
    QR_CODE_PATH = os.getenv('QR_CODE_PATH', './qr_codes')
    # 照片存储目录（用于扫码截图等通用照片保存）
    PHOTO_STORAGE_PATH = os.getenv('PHOTO_STORAGE_PATH', './storage/photo')
    
    # 数据记录配置
    MAX_RECORDS_PER_STRAWBERRY = 10  # 每颗草莓最多保留记录数
    
    # 二维码配置
    QR_CODE_SIZE = 10
    QR_CODE_BORDER = 4
    
    @classmethod
    def validate_config(cls):
        """验证必要的配置是否已设置"""
        if not cls.DB_USER or not cls.DB_PASSWORD:
            raise ValueError("请在.env文件中设置数据库用户名和密码")
        
        # 创建必要的目录
        os.makedirs(cls.IMAGE_STORAGE_PATH, exist_ok=True)
        os.makedirs(cls.QR_CODE_PATH, exist_ok=True)
        os.makedirs(cls.PHOTO_STORAGE_PATH, exist_ok=True)