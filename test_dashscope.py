#!/usr/bin/env python3
"""
测试阿里百炼API集成
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.ai_service import AIService

def test_dashscope_config():
    """测试阿里百炼配置"""
    print("🧪 测试阿里百炼API配置")
    print("=" * 50)
    
    # 创建AI服务实例
    ai_service = AIService("test_ai_config.json")
    
    # 设置测试配置
    test_config = {
        "enabled": True,
        "provider": "dashscope",
        "api_key": "test-api-key",
        "app_id": "test-app-id",
        "model": "qwen-vl-plus",
        "custom_prompt": "请描述这张图片",
        "timeout": 30,
        "max_retries": 3
    }
    
    # 保存配置
    success = ai_service.save_config(test_config)
    print(f"✅ 配置保存: {'成功' if success else '失败'}")
    
    # 验证配置加载
    loaded_config = ai_service.load_config()
    print(f"✅ 提供商: {loaded_config.get('provider')}")
    print(f"✅ 模型: {loaded_config.get('model')}")
    print(f"✅ 应用ID: {loaded_config.get('app_id')}")
    print(f"✅ API密钥: {'已配置' if loaded_config.get('api_key') else '未配置'}")
    
    # 验证默认配置包含阿里百炼选项
    default_config = ai_service.get_default_config()
    print(f"✅ 默认配置包含app_id字段: {'app_id' in default_config}")
    
    # 清理测试文件
    if os.path.exists("test_ai_config.json"):
        os.remove("test_ai_config.json")
    
    print("=" * 50)
    print("🎉 阿里百炼API配置测试完成")

if __name__ == "__main__":
    test_dashscope_config()