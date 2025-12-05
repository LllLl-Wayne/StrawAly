#!/usr/bin/env python3
"""
草莓溯源系统快速验证脚本
用于验证系统基本功能是否正常
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_dependencies():
    """检查依赖包是否已安装"""
    required_packages = [
        'mysql.connector',
        'qrcode', 
        'PIL',
        'dotenv'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'mysql.connector':
                import mysql.connector
            elif package == 'PIL':
                from PIL import Image
            else:
                __import__(package)
            print(f"✅ {package}: 已安装")
        except ImportError:
            print(f"❌ {package}: 未安装")
            missing_packages.append(package)
    
    return len(missing_packages) == 0, missing_packages

def check_configuration():
    """检查配置文件"""
    try:
        from config import Config
        Config.validate_config()
        print("✅ 配置文件: 验证通过")
        return True
    except Exception as e:
        print(f"❌ 配置文件: {e}")
        return False

def check_database_connection():
    """检查数据库连接"""
    try:
        from modules.database import db_manager
        if db_manager.test_connection():
            print("✅ 数据库连接: 成功")
            return True
        else:
            print("❌ 数据库连接: 失败")
            return False
    except Exception as e:
        print(f"❌ 数据库连接: {e}")
        return False

def check_directories():
    """检查必要目录"""
    directories = ['images', 'qr_codes', 'modules']
    all_exist = True
    
    for directory in directories:
        if os.path.exists(directory):
            print(f"✅ 目录 {directory}: 存在")
        else:
            print(f"❌ 目录 {directory}: 不存在")
            all_exist = False
    
    return all_exist

def main():
    """主验证函数"""
    print("🍓 草莓溯源系统 - 快速验证")
    print("=" * 50)
    
    all_checks_passed = True
    
    # 1. 检查依赖包
    print("\n1️⃣ 检查Python依赖包...")
    deps_ok, missing = check_dependencies()
    if not deps_ok:
        print(f"\n⚠️ 缺少依赖包: {', '.join(missing)}")
        print("请运行: pip install -r requirements.txt")
        all_checks_passed = False
    
    # 2. 检查目录结构
    print("\n2️⃣ 检查目录结构...")
    dirs_ok = check_directories()
    if not dirs_ok:
        all_checks_passed = False
    
    # 3. 检查配置文件
    print("\n3️⃣ 检查配置文件...")
    config_ok = check_configuration()
    if not config_ok:
        print("\n⚠️ 请检查.env配置文件是否正确")
        all_checks_passed = False
    
    # 4. 检查数据库连接
    print("\n4️⃣ 检查数据库连接...")
    db_ok = check_database_connection()
    if not db_ok:
        print("\n⚠️ 请检查数据库配置和服务状态")
        all_checks_passed = False
    
    # 总结
    print("\n" + "=" * 50)
    if all_checks_passed:
        print("🎉 所有检查都通过！系统准备就绪。")
        print("\n可以运行以下命令开始使用:")
        print("  python main.py          # 启动交互界面")
        print("  python examples/demo.py # 运行示例程序")
        return 0
    else:
        print("❌ 部分检查失败，请根据上述提示解决问题后重试。")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)