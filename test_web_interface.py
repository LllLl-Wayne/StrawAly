#!/usr/bin/env python3
"""测试Web界面中的图片显示"""

import webbrowser
import time

def test_web_interface():
    print("🌐 测试Web界面图片显示")
    print("=" * 50)
    
    # 打开浏览器到Web界面
    url = "http://127.0.0.1:5000"
    print(f"正在打开浏览器: {url}")
    
    try:
        webbrowser.open(url)
        print("✅ 浏览器已打开，请检查以下内容：")
        print("1. 点击 '草莓列表' 标签")
        print("2. 点击任意草莓条目查看详情")
        print("3. 查看观察记录中的图片是否能正常显示")
        print("4. 如果图片无法显示，请检查浏览器开发者工具的控制台")
        
        print("\n🔍 直接图片URL测试：")
        test_urls = [
            "http://127.0.0.1:5000/api/images/strawberry_1_20250923_122011_162229FB.jpg",
            "http://127.0.0.1:5000/api/images/strawberry_1_20250923_131004_A2375533.jpg"
        ]
        
        for url in test_urls:
            print(f"测试URL: {url}")
            print("(在浏览器新标签页中打开上述URL看看是否能显示图片)")
            
    except Exception as e:
        print(f"❌ 打开浏览器失败: {e}")

if __name__ == "__main__":
    test_web_interface()