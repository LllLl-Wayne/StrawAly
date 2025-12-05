#!/usr/bin/env python3
"""
调试图片路径问题的临时脚本
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.database import db_manager

def check_image_paths():
    """检查数据库中的图片路径"""
    try:
        # 连接数据库
        db_manager.connect()
        
        # 查询观察记录中的图片路径
        query = "SELECT id, strawberry_id, image_path, recorded_at FROM strawberry_records ORDER BY id DESC LIMIT 10"
        cursor = db_manager.connection.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        
        print("📷 数据库中的图片路径:")
        print("=" * 80)
        
        for record in results:
            record_id, strawberry_id, image_path, recorded_at = record
            print(f"记录ID: {record_id}")
            print(f"草莓ID: {strawberry_id}")
            print(f"图片路径: {image_path}")
            print(f"记录时间: {recorded_at}")
            
            # 检查文件是否存在
            if image_path:
                full_path = os.path.join(".", image_path)
                exists = os.path.exists(full_path)
                print(f"文件存在: {'✅ 是' if exists else '❌ 否'}")
                if exists:
                    size = os.path.getsize(full_path)
                    print(f"文件大小: {size} 字节")
            print("-" * 40)
        
        # 检查存储目录
        print("\n📁 存储目录内容:")
        print("=" * 80)
        
        storage_paths = [
            "./storage/images",
            "./temp_uploads"
        ]
        
        for path in storage_paths:
            if os.path.exists(path):
                print(f"\n目录: {path}")
                for item in os.listdir(path):
                    item_path = os.path.join(path, item)
                    if os.path.isfile(item_path):
                        size = os.path.getsize(item_path)
                        print(f"  📄 {item} ({size} 字节)")
                    else:
                        print(f"  📁 {item}/")
            else:
                print(f"\n目录不存在: {path}")
                
    except Exception as e:
        print(f"❌ 检查失败: {e}")
    finally:
        db_manager.close()

if __name__ == "__main__":
    check_image_paths()