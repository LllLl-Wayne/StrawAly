"""
AI服务模块 - 支持多种AI提供商的图像描述生成
"""
import os
import json
import base64
import requests
import logging
from typing import Optional, Dict, Any
from PIL import Image

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, config_file: str = "ai_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """加载AI配置"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"加载AI配置失败: {e}")
        return self.get_default_config()
    
    def save_config(self, config: Dict[str, Any]) -> bool:
        """保存AI配置"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.config = config
            return True
        except Exception as e:
            logger.error(f"保存AI配置失败: {e}")
            return False
    
    def get_default_config(self) -> Dict[str, Any]:
        """获取默认配置"""
        return {
            "enabled": False,
            "provider": "openai",  # openai, custom, dashscope
            "api_key": "",
            "api_url": "",
            "model": "gpt-4o-mini",
            "app_id": "",  # 阿里百炼应用ID
            "custom_prompt": "请以Markdown格式详细描述这张草莓图片。请包含以下内容：\n\n## 基本观察\n- 颜色：\n- 形状：\n- 大小：\n- 成熟度：\n\n## 生长状态\n- 整体健康状况：\n- 表面特征：\n- 生长阶段：\n\n## 其他特征\n- 特殊标记或异常：\n- 建议或注意事项：",
            "timeout": 30,
            "max_retries": 3
        }
    
    def is_enabled(self) -> bool:
        """检查AI服务是否启用"""
        return self.config.get("enabled", False) and bool(self.config.get("api_key", "").strip())
    
    def encode_image(self, image_path: str) -> Optional[str]:
        """将图像编码为base64"""
        try:
            # 检查文件是否存在
            if not os.path.exists(image_path):
                logger.error(f"图片文件不存在: {image_path}")
                return None
            
            # 压缩图像以减少API调用成本
            with Image.open(image_path) as img:
                # 转换为RGB格式
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # 压缩图像尺寸
                max_size = 1024
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # 保存为临时文件
                temp_path = image_path + "_temp.jpg"
                img.save(temp_path, "JPEG", quality=85)
            
            # 读取并编码
            with open(temp_path, "rb") as image_file:
                encoded = base64.b64encode(image_file.read()).decode('utf-8')
            
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return encoded
        except Exception as e:
            logger.error(f"图像编码失败: {e}")
            return None
    
    def call_openai_api(self, image_base64: str) -> Optional[str]:
        """调用OpenAI API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.config['api_key']}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.config.get("model", "gpt-4o-mini"),
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": self.config.get("custom_prompt", "请详细描述这张草莓图片的外观特征。")
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 300
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=self.config.get("timeout", 30)
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                logger.error(f"OpenAI API调用失败: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"OpenAI API调用异常: {e}")
            return None
    
    def call_custom_api(self, image_base64: str) -> Optional[str]:
        """调用自定义API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.config['api_key']}",
                "Content-Type": "application/json"
            }
            
            # 自定义API的请求格式可能不同，这里提供一个通用模板
            payload = {
                "image": image_base64,
                "prompt": self.config.get("custom_prompt", "请详细描述这张草莓图片的外观特征。"),
                "max_tokens": 300
            }
            
            response = requests.post(
                self.config.get("api_url", ""),
                headers=headers,
                json=payload,
                timeout=self.config.get("timeout", 30)
            )
            
            if response.status_code == 200:
                result = response.json()
                # 根据不同的API返回格式调整
                if 'description' in result:
                    return result['description']
                elif 'content' in result:
                    return result['content']
                elif 'text' in result:
                    return result['text']
                else:
                    return str(result)
            else:
                logger.error(f"自定义API调用失败: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"自定义API调用异常: {e}")
            return None
    
    def call_dashscope_api(self, image_base64: str) -> Optional[str]:
        """调用阿里百炼DashScope API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.config['api_key']}",
                "Content-Type": "application/json"
            }
            
            # 阿里百炼API请求格式
            payload = {
                "model": self.config.get("model", "qwen-vl-plus"),
                "input": {
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "image": f"data:image/jpeg;base64,{image_base64}"
                                },
                                {
                                    "text": self.config.get("custom_prompt", "请详细描述这张草莓图片的外观特征，包括颜色、形状、大小、成熟度等。")
                                }
                            ]
                        }
                    ]
                },
                "parameters": {
                    "max_tokens": 300
                }
            }
            
            # 如果配置了应用ID，添加到请求中
            if self.config.get("app_id"):
                payload["app_id"] = self.config["app_id"]
            
            response = requests.post(
                "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
                headers=headers,
                json=payload,
                timeout=self.config.get("timeout", 30)
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("output") and result["output"].get("choices"):
                    content = result["output"]["choices"][0]["message"]["content"]
                    # 处理阿里百炼返回的数组格式
                    if isinstance(content, list) and len(content) > 0:
                        # 如果是数组，提取第一个元素的text字段
                        if isinstance(content[0], dict) and 'text' in content[0]:
                            return content[0]['text']
                        else:
                            return str(content[0])
                    elif isinstance(content, str):
                        return content
                    else:
                        return str(content)
                else:
                    logger.error(f"阿里百炼API返回格式异常: {result}")
                    return None
            else:
                logger.error(f"阿里百炼API调用失败: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"阿里百炼API调用异常: {e}")
            return None
    
    def generate_description(self, image_path: str) -> Optional[str]:
        """生成图像描述"""
        if not self.is_enabled():
            return None
        
        # 编码图像
        image_base64 = self.encode_image(image_path)
        if not image_base64:
            return None
        
        # 根据配置调用不同的API
        provider = self.config.get("provider", "openai")
        retries = 0
        max_retries = self.config.get("max_retries", 3)
        
        while retries < max_retries:
            try:
                if provider == "openai":
                    description = self.call_openai_api(image_base64)
                elif provider == "custom":
                    description = self.call_custom_api(image_base64)
                elif provider == "dashscope":
                    description = self.call_dashscope_api(image_base64)
                else:
                    logger.error(f"不支持的AI提供商: {provider}")
                    return None
                
                if description:
                    return description
                    
            except Exception as e:
                logger.error(f"AI描述生成失败 (尝试 {retries + 1}/{max_retries}): {e}")
            
            retries += 1
        
        return None
    
    def test_connection(self) -> Dict[str, Any]:
        """测试AI连接"""
        if not self.is_enabled():
            return {"success": False, "message": "AI服务未启用或API密钥为空"}
        
        try:
            # 创建一个简单的测试图像
            import numpy as np
            pixels = np.zeros((100, 100, 3), dtype=np.uint8)
            pixels[:, :] = [255, 0, 0]  # 红色
            test_image = Image.fromarray(pixels)
            
            # 保存测试图像
            test_path = "test_image.jpg"
            test_image.save(test_path)
            
            # 尝试生成描述
            description = self.generate_description(test_path)
            
            # 清理测试文件
            if os.path.exists(test_path):
                os.remove(test_path)
            
            if description:
                return {"success": True, "message": "AI连接测试成功", "description": description}
            else:
                return {"success": False, "message": "AI连接测试失败，请检查配置"}
                
        except Exception as e:
            return {"success": False, "message": f"AI连接测试异常: {str(e)}"}

# 全局AI服务实例
ai_service = AIService()