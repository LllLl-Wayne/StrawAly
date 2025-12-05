#!/usr/bin/env python3
"""测试图片访问功能"""

import requests
import urllib.parse

def test_image_access():
    base_url = "http://127.0.0.1:5000"
    
    # 测试图片路径
    test_paths = [
        "./storage/images/strawberry_1_20250923_122011_162229FB.jpg",
        "storage/images/strawberry_1_20250923_122011_162229FB.jpg", 
        "./storage/images\\strawberry_1_20250923_122011_162229FB.jpg",
        "strawberry_1_20250923_122011_162229FB.jpg"
    ]
    
    print("🧪 测试图片访问功能")
    print("=" * 50)
    
    for i, path in enumerate(test_paths, 1):
        print(f"\n测试 {i}: {path}")
        
        # URL编码路径
        encoded_path = urllib.parse.quote(path, safe='')
        url = f"{base_url}/api/images/{encoded_path}"
        
        print(f"请求URL: {url}")
        
        try:
            response = requests.get(url, timeout=5)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ 成功! 内容类型: {response.headers.get('content-type')}")
                print(f"✅ 文件大小: {len(response.content)} 字节")
            else:
                print(f"❌ 失败: {response.text[:100]}")
                
        except Exception as e:
            print(f"❌ 连接错误: {e}")
    
    # 测试直接文件访问
    print(f"\n直接访问测试:")
    direct_url = f"{base_url}/api/images/strawberry_1_20250923_122011_162229FB.jpg"
    print(f"直接URL: {direct_url}")
    
    try:
        response = requests.get(direct_url, timeout=5)
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ 直接访问成功!")
        else:
            print(f"❌ 直接访问失败: {response.text[:100]}")
    except Exception as e:
        print(f"❌ 直接访问错误: {e}")

if __name__ == "__main__":
    test_image_access()