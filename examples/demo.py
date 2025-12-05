"""
草莓溯源系统示例和测试代码
展示如何使用各个模块的功能
"""
import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.trace_service import trace_service
from modules.qr_code import qr_manager
from modules.image_manager import image_manager
from modules.database import db_manager

def test_basic_functionality():
    """测试基础功能"""
    print("🧪 开始基础功能测试")
    print("=" * 50)
    
    try:
        # 1. 测试数据库连接
        print("1. 测试数据库连接...")
        if db_manager.test_connection():
            print("   ✅ 数据库连接成功")
        else:
            print("   ❌ 数据库连接失败")
            return False
        
        # 2. 测试创建草莓
        print("\n2. 测试创建草莓...")
        strawberry = trace_service.create_new_strawberry("测试草莓", "TEST")
        if strawberry:
            test_strawberry_id = strawberry['id']
            print(f"   ✅ 草莓创建成功，ID: {test_strawberry_id}")
        else:
            print("   ❌ 草莓创建失败")
            return False
        
        # 3. 测试统计功能
        print("\n3. 测试统计功能...")
        stats = trace_service.get_statistics_report()
        if stats:
            print(f"   ✅ 统计信息获取成功，草莓总数: {stats.get('total_strawberries', 0)}")
        else:
            print("   ❌ 统计信息获取失败")
            return False
        
        print("\n🎉 所有基础功能测试通过！")
        return True
        
    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {e}")
        return False

def create_sample_data():
    """创建示例数据"""
    print("\n📝 创建示例数据...")
    
    sample_strawberries = [
        {"notes": "1号实验田草莓", "prefix": "EXP1"},
        {"notes": "2号实验田草莓", "prefix": "EXP2"},
        {"notes": "温室栽培草莓", "prefix": "GH"},
    ]
    
    created_count = 0
    for sample in sample_strawberries:
        strawberry = trace_service.create_new_strawberry(
            sample["notes"], sample["prefix"]
        )
        if strawberry:
            created_count += 1
            print(f"✅ 创建草莓: {strawberry['qr_code']}")
        else:
            print(f"❌ 创建失败: {sample['notes']}")
    
    print(f"\n📊 示例数据创建完成，成功创建 {created_count} 个草莓")
    return created_count > 0

if __name__ == "__main__":
    print("🍓 草莓溯源系统示例测试")
    print("=" * 60)
    
    # 运行基础功能测试
    if test_basic_functionality():
        # 创建示例数据
        create_sample_data()
        print("\n✅ 示例程序运行完成！")
    else:
        print("\n❌ 测试失败，请检查系统配置")