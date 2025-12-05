#!/usr/bin/env python3
"""
草莓生长溯源系统主程序
提供命令行界面和核心功能演示
"""
import sys
import os
import argparse
from datetime import datetime
import logging

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from modules.trace_service import trace_service
from modules.database import db_manager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('strawberry_trace.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class StrawberryTraceApp:
    """草莓溯源应用主类"""
    
    def __init__(self):
        """初始化应用"""
        self.service = trace_service
        self.running = True
    
    def initialize_system(self):
        """初始化系统"""
        try:
            logger.info("正在初始化草莓溯源系统...")
            
            # 验证配置
            Config.validate_config()
            logger.info("配置验证通过")
            
            # 测试数据库连接
            if not db_manager.test_connection():
                logger.error("数据库连接失败，请检查配置")
                return False
            
            logger.info("系统初始化完成")
            return True
            
        except Exception as e:
            logger.error(f"系统初始化失败: {e}")
            return False
    
    def print_menu(self):
        """打印主菜单"""
        print("\n" + "="*50)
        print("🍓 草莓生长溯源管理系统")
        print("="*50)
        print("1. 创建新草莓")
        print("2. 添加观察记录 (支持扫码输入)")
        print("3. 查看草莓信息 (支持扫码输入)")
        print("4. 通过二维码查询")
        print("5. 查看草莓列表")
        print("6. 查看统计报告")
        print("7. 导出草莓数据")
        print("8. 系统完整性检查")
        print("9. 批量生成二维码")
        print("0. 退出系统")
        print("="*50)
    
    def create_new_strawberry(self):
        """创建新草莓"""
        try:
            print("\n🆕 创建新草莓")
            print("-" * 30)
            
            # 获取用户输入
            notes = input("请输入备注信息（可选）: ").strip()
            custom_prefix = input("请输入自定义前缀（可选，默认SB）: ").strip()
            
            if not notes:
                notes = None
            if not custom_prefix:
                custom_prefix = None
            
            # 创建草莓
            print("正在创建草莓记录...")
            strawberry = self.service.create_new_strawberry(notes, custom_prefix)
            
            if strawberry:
                print("✅ 草莓创建成功！")
                print(f"草莓ID: {strawberry['id']}")
                print(f"二维码: {strawberry['qr_code']}")
                print(f"二维码图片: {strawberry['qr_code_path']}")
                print(f"创建时间: {strawberry['created_at']}")
                if strawberry.get('notes'):
                    print(f"备注: {strawberry['notes']}")
            else:
                print("❌ 草莓创建失败")
                
        except Exception as e:
            logger.error(f"创建草莓失败: {e}")
            print(f"❌ 创建失败: {e}")
    
    def add_observation_record(self):
        """添加观察记录"""
        try:
            print("\n📸 添加观察记录")
            print("-" * 30)
            
            # 获取草莓信息（支持ID或二维码）
            strawberry_input = input("请输入草莓ID或扫描二维码: ").strip()
            if not strawberry_input:
                print("❌ 输入不能为空")
                return
            
            # 判断输入是数字ID还是二维码内容
            strawberry_id = None
            if strawberry_input.isdigit():
                # 数字ID
                strawberry_id = int(strawberry_input)
                print(f"🔍 使用草莓ID: {strawberry_id}")
            else:
                # 二维码内容，需要查找对应的ID
                print(f"🔍 通过二维码查找草莓: {strawberry_input}")
                strawberry_info = self.service.search_strawberry_by_qr(strawberry_input)
                if not strawberry_info:
                    print("❌ 未找到对应的草莓，请检查二维码内容")
                    return
                
                strawberry = strawberry_info['strawberry']
                strawberry_id = strawberry['id']
                print(f"✅ 找到草莓: ID={strawberry_id}, 二维码={strawberry['qr_code']}")
            
            # 获取图片路径
            image_path = input("请输入图片文件路径: ").strip()
            if not os.path.exists(image_path):
                print("❌ 图片文件不存在")
                return
            
            # 获取可选信息
            ai_description_input = input("请输入AI描述（可选）: ").strip()
            ai_description = ai_description_input if ai_description_input else None
            
            print("生长阶段选项: seedling, flowering, fruiting, ripening, mature")
            growth_stage = input("请选择生长阶段（可选）: ").strip() or None
            
            print("健康状态选项: healthy, warning, sick")
            health_status = input("请选择健康状态（默认healthy）: ").strip() or 'healthy'
            
            size_estimate = input("请输入大小估计（可选）: ").strip() or None
            color_description = input("请输入颜色描述（可选）: ").strip() or None
            
            # 添加记录
            print("正在保存观察记录...")
            record = self.service.add_observation_record(
                strawberry_id, image_path, ai_description, growth_stage,
                health_status, size_estimate, color_description
            )
            
            if record:
                print("✅ 观察记录添加成功！")
                print(f"记录ID: {record['id']}")
                print(f"图片路径: {record['image_path']}")
                print(f"记录时间: {record['recorded_at']}")
                if record.get('ai_description'):
                    print(f"AI描述: {record['ai_description']}")
            else:
                print("❌ 观察记录添加失败")
                
        except Exception as e:
            logger.error(f"添加观察记录失败: {e}")
            print(f"❌ 添加失败: {e}")
    
    def view_strawberry_info(self):
        """查看草莓信息"""
        try:
            print("\n👀 查看草莓信息")
            print("-" * 30)
            
            strawberry_input = input("请输入草莓ID或二维码内容: ").strip()
            if not strawberry_input:
                print("❌ 输入不能为空")
                return
            
            print("正在获取草莓信息...")
            
            # 判断输入是数字ID还是二维码内容
            if strawberry_input.isdigit():
                # 数字ID
                strawberry_id = int(strawberry_input)
                full_info = self.service.get_strawberry_full_info(strawberry_id)
            else:
                # 二维码内容
                full_info = self.service.search_strawberry_by_qr(strawberry_input)
            
            if not full_info:
                print("❌ 未找到草莓信息")
                return
            
            strawberry = full_info['strawberry']
            records = full_info['records']
            
            # 显示基本信息
            print("\n📋 基本信息:")
            print(f"ID: {strawberry['id']}")
            print(f"二维码: {strawberry['qr_code']}")
            print(f"状态: {strawberry['status']}")
            print(f"创建时间: {strawberry['created_at']}")
            if strawberry.get('notes'):
                print(f"备注: {strawberry['notes']}")
            
            # 显示记录
            print(f"\n📈 生长记录 (共{len(records)}条):")
            for i, record in enumerate(records, 1):
                print(f"\n记录 {i}:")
                print(f"  时间: {record['recorded_at']}")
                if record.get('growth_stage'):
                    print(f"  生长阶段: {record['growth_stage']}")
                if record.get('health_status'):
                    print(f"  健康状态: {record['health_status']}")
                if record.get('ai_description'):
                    print(f"  AI描述: {record['ai_description']}")
                print(f"  图片: {record['image_path']}")
                
        except Exception as e:
            logger.error(f"查看草莓信息失败: {e}")
            print(f"❌ 查看失败: {e}")
    
    def search_by_qr_code(self):
        """通过二维码查询"""
        try:
            print("\n🔍 通过二维码查询")
            print("-" * 30)
            
            qr_content = input("请输入二维码内容: ").strip()
            if not qr_content:
                print("❌ 二维码内容不能为空")
                return
            
            print("正在查询...")
            full_info = self.service.search_strawberry_by_qr(qr_content)
            
            if not full_info:
                print("❌ 未找到对应的草莓")
                return
            
            strawberry = full_info['strawberry']
            records = full_info['records']
            
            print("✅ 找到草莓信息:")
            print(f"ID: {strawberry['id']}")
            print(f"状态: {strawberry['status']}")
            print(f"创建时间: {strawberry['created_at']}")
            print(f"记录数量: {len(records)}")
            
            if records:
                latest_record = records[0]
                print(f"最新记录时间: {latest_record['recorded_at']}")
                if latest_record.get('growth_stage'):
                    print(f"当前生长阶段: {latest_record['growth_stage']}")
                
        except Exception as e:
            logger.error(f"二维码查询失败: {e}")
            print(f"❌ 查询失败: {e}")
    
    def view_strawberry_list(self):
        """查看草莓列表"""
        try:
            print("\n📋 草莓列表")
            print("-" * 30)
            
            print("状态过滤选项: active, inactive, harvested")
            status_filter = input("请选择状态过滤（可选）: ").strip() or None
            
            limit_str = input("请输入显示数量限制（可选）: ").strip()
            limit = int(limit_str) if limit_str and limit_str.isdigit() else None
            
            print("正在获取草莓列表...")
            strawberries = self.service.get_strawberry_list(status_filter, limit)
            
            if not strawberries:
                print("❌ 没有找到草莓记录")
                return
            
            print(f"\n✅ 找到 {len(strawberries)} 条记录:")
            print("-" * 80)
            print(f"{'ID':<5} {'二维码':<20} {'状态':<10} {'最新记录时间':<20} {'生长阶段':<10}")
            print("-" * 80)
            
            for strawberry in strawberries:
                latest_time = strawberry.get('latest_recorded_at', '无记录')
                growth_stage = strawberry.get('latest_growth_stage', '未知')
                
                print(f"{strawberry['id']:<5} {strawberry['qr_code']:<20} "
                      f"{strawberry['strawberry_status']:<10} {str(latest_time):<20} {growth_stage:<10}")
                
        except Exception as e:
            logger.error(f"查看草莓列表失败: {e}")
            print(f"❌ 查看失败: {e}")
    
    def view_statistics(self):
        """查看统计报告"""
        try:
            print("\n📊 统计报告")
            print("-" * 30)
            
            print("正在生成统计报告...")
            stats = self.service.get_statistics_report()
            
            if not stats:
                print("❌ 获取统计信息失败")
                return
            
            print("✅ 统计信息:")
            print(f"草莓总数: {stats.get('total_strawberries', 0)}")
            print(f"记录总数: {stats.get('total_records', 0)}")
            print(f"今日新增草莓: {stats.get('today_new_strawberries', 0)}")
            print(f"本周新增草莓: {stats.get('week_new_strawberries', 0)}")
            
            # 状态统计
            status_counts = stats.get('status_counts', {})
            if status_counts:
                print("\n状态分布:")
                for status, count in status_counts.items():
                    print(f"  {status}: {count}")
            
            # 生长阶段统计
            stage_counts = stats.get('growth_stage_counts', {})
            if stage_counts:
                print("\n生长阶段分布:")
                for stage, count in stage_counts.items():
                    print(f"  {stage}: {count}")
            
            # 健康状态统计
            health_counts = stats.get('health_status_counts', {})
            if health_counts:
                print("\n健康状态分布:")
                for health, count in health_counts.items():
                    print(f"  {health}: {count}")
                    
        except Exception as e:
            logger.error(f"查看统计报告失败: {e}")
            print(f"❌ 查看失败: {e}")
    
    def export_strawberry_data(self):
        """导出草莓数据"""
        try:
            print("\n📤 导出草莓数据")
            print("-" * 30)
            
            strawberry_id = input("请输入草莓ID: ").strip()
            if not strawberry_id or not strawberry_id.isdigit():
                print("❌ 无效的草莓ID")
                return
            
            strawberry_id = int(strawberry_id)
            
            print("正在导出数据...")
            exported_data = self.service.export_strawberry_data(strawberry_id, 'json')
            
            if not exported_data:
                print("❌ 导出数据失败")
                return
            
            # 保存到文件
            filename = f"strawberry_{strawberry_id}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(exported_data)
            
            print(f"✅ 数据导出成功，保存到: {filename}")
            
        except Exception as e:
            logger.error(f"导出数据失败: {e}")
            print(f"❌ 导出失败: {e}")
    
    def check_system_integrity(self):
        """系统完整性检查"""
        try:
            print("\n🔧 系统完整性检查")
            print("-" * 30)
            
            print("正在检查系统完整性...")
            result = self.service.validate_system_integrity()
            
            if result['valid']:
                print("✅ 系统完整性检查通过")
            else:
                print("⚠️ 发现系统问题:")
                for issue in result['issues']:
                    print(f"  - {issue}")
            
            stats = result.get('statistics', {})
            if stats:
                print("\n统计信息:")
                for key, value in stats.items():
                    print(f"  {key}: {value}")
                    
        except Exception as e:
            logger.error(f"系统完整性检查失败: {e}")
            print(f"❌ 检查失败: {e}")
    
    def batch_generate_qr_codes(self):
        """批量生成二维码"""
        try:
            print("\n🏭 批量生成二维码")
            print("-" * 30)
            
            count_str = input("请输入生成数量: ").strip()
            if not count_str or not count_str.isdigit():
                print("❌ 无效的数量")
                return
            
            count = int(count_str)
            if count <= 0 or count > 100:
                print("❌ 数量必须在1-100之间")
                return
            
            prefix = input("请输入前缀（可选，默认SB）: ").strip() or "SB"
            
            print(f"正在批量生成 {count} 个二维码...")
            
            success_count = 0
            for i in range(count):
                strawberry = self.service.create_new_strawberry(f"批量生成 {i+1}", prefix)
                if strawberry:
                    success_count += 1
                    print(f"  {i+1}/{count}: {strawberry['qr_code']}")
                else:
                    print(f"  {i+1}/{count}: 生成失败")
            
            print(f"✅ 批量生成完成，成功: {success_count}/{count}")
            
        except Exception as e:
            logger.error(f"批量生成失败: {e}")
            print(f"❌ 批量生成失败: {e}")
    
    def run_interactive_mode(self):
        """运行交互模式"""
        if not self.initialize_system():
            print("❌ 系统初始化失败，程序退出")
            return
        
        print("✅ 草莓溯源系统启动成功")
        
        while self.running:
            try:
                self.print_menu()
                choice = input("\n请选择操作 (0-9): ").strip()
                
                if choice == '1':
                    self.create_new_strawberry()
                elif choice == '2':
                    self.add_observation_record()
                elif choice == '3':
                    self.view_strawberry_info()
                elif choice == '4':
                    self.search_by_qr_code()
                elif choice == '5':
                    self.view_strawberry_list()
                elif choice == '6':
                    self.view_statistics()
                elif choice == '7':
                    self.export_strawberry_data()
                elif choice == '8':
                    self.check_system_integrity()
                elif choice == '9':
                    self.batch_generate_qr_codes()
                elif choice == '0':
                    print("👋 感谢使用草莓溯源系统，再见！")
                    self.running = False
                else:
                    print("❌ 无效选择，请重新选择")
                
                if self.running and choice != '0':
                    input("\n按回车键继续...")
                    
            except KeyboardInterrupt:
                print("\n\n👋 用户中断，系统退出")
                self.running = False
            except Exception as e:
                logger.error(f"程序运行错误: {e}")
                print(f"❌ 程序错误: {e}")
                input("\n按回车键继续...")
    
    def run_command_mode(self, args):
        """运行命令行模式"""
        if not self.initialize_system():
            print("❌ 系统初始化失败")
            return 1
        
        try:
            if args.command == 'create':
                strawberry = self.service.create_new_strawberry(args.notes, args.prefix)
                if strawberry:
                    print(f"✅ 草莓创建成功，ID: {strawberry['id']}, QR: {strawberry['qr_code']}")
                    return 0
                else:
                    print("❌ 草莓创建失败")
                    return 1
            
            elif args.command == 'add_record':
                record = self.service.add_observation_record(
                    args.strawberry_id, args.image_path, args.description
                )
                if record:
                    print(f"✅ 记录添加成功，ID: {record['id']}")
                    return 0
                else:
                    print("❌ 记录添加失败")
                    return 1
            
            elif args.command == 'query':
                if args.qr_code:
                    full_info = self.service.search_strawberry_by_qr(args.qr_code)
                else:
                    full_info = self.service.get_strawberry_full_info(args.strawberry_id)
                
                if full_info:
                    strawberry = full_info['strawberry']
                    print(f"ID: {strawberry['id']}, QR: {strawberry['qr_code']}, "
                          f"状态: {strawberry['status']}, 记录数: {len(full_info['records'])}")
                    return 0
                else:
                    print("❌ 未找到草莓信息")
                    return 1
            
            elif args.command == 'stats':
                stats = self.service.get_statistics_report()
                print(f"草莓总数: {stats.get('total_strawberries', 0)}")
                print(f"记录总数: {stats.get('total_records', 0)}")
                return 0
            
            else:
                print("❌ 未知命令")
                return 1
                
        except Exception as e:
            logger.error(f"命令执行失败: {e}")
            print(f"❌ 命令执行失败: {e}")
            return 1

def create_argument_parser():
    """创建命令行参数解析器"""
    parser = argparse.ArgumentParser(description='草莓生长溯源系统')
    parser.add_argument('--interactive', '-i', action='store_true', 
                       help='启动交互模式')
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 创建草莓
    create_parser = subparsers.add_parser('create', help='创建新草莓')
    create_parser.add_argument('--notes', '-n', help='备注信息')
    create_parser.add_argument('--prefix', '-p', help='二维码前缀')
    
    # 添加记录
    add_parser = subparsers.add_parser('add_record', help='添加观察记录')
    add_parser.add_argument('strawberry_id', type=int, help='草莓ID')
    add_parser.add_argument('image_path', help='图片路径')
    add_parser.add_argument('--description', '-d', help='描述信息')
    
    # 查询
    query_parser = subparsers.add_parser('query', help='查询草莓信息')
    query_group = query_parser.add_mutually_exclusive_group(required=True)
    query_group.add_argument('--strawberry_id', '-id', type=int, help='草莓ID')
    query_group.add_argument('--qr_code', '-qr', help='二维码内容')
    
    # 统计
    subparsers.add_parser('stats', help='显示统计信息')
    
    return parser

def main():
    """主函数"""
    parser = create_argument_parser()
    args = parser.parse_args()
    
    app = StrawberryTraceApp()
    
    # 如果没有参数或指定交互模式，启动交互界面
    if len(sys.argv) == 1 or args.interactive:
        app.run_interactive_mode()
    else:
        # 命令行模式
        return app.run_command_mode(args)

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code if exit_code is not None else 0)