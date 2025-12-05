#!/usr/bin/env python3
"""
草莓生长溯源系统 - Web API 服务器
提供RESTful API接口和静态文件服务
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Optional
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
import traceback

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from modules.trace_service import trace_service
from modules.database import db_manager
from modules.ai_service import ai_service

# 配置日志（文件 + 控制台）
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('strawberry_trace.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
logger.info("Web API 服务初始化完成")

# 配置CORS
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# 配置
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'temp_uploads'
app.config['SECRET_KEY'] = 'strawberry_trace_secret_key_2024'
app.config['PHOTO_STORAGE_PATH'] = Config.PHOTO_STORAGE_PATH

# 创建上传文件夹
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PHOTO_STORAGE_PATH'], exist_ok=True)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def error_response(message: str, code: int = 400):
    """返回错误响应"""
    return jsonify({
        'success': False,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }), code

def success_response(data=None, message: str = 'Success'):
    """返回成功响应"""
    # 转换datetime对象为字符串，确保前端解析一致
    def convert_datetime(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_datetime(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_datetime(item) for item in obj]
        else:
            return obj

    response = {
        'success': True,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    if data is not None:
        response['data'] = convert_datetime(data)
    return jsonify(response)

# === 静态文件路由 ===

@app.route('/')
def index():
    """主页"""
    return send_from_directory('web', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """静态文件服务"""
    try:
        return send_from_directory('web', filename)
    except FileNotFoundError:
        return error_response('文件未找到', 404)

# === API 路由 ===

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        # 测试数据库连接
        db_status = db_manager.test_connection()
        return success_response({
            'status': 'healthy' if db_status else 'unhealthy',
            'database': 'connected' if db_status else 'disconnected',
            'version': '1.0.0'
        })
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return error_response(f"健康检查失败: {str(e)}", 500)

@app.route('/api/strawberries', methods=['GET'])
def get_strawberries():
    """获取草莓列表"""
    try:
        status = request.args.get('status')
        limit_str = request.args.get('limit')
        limit = int(limit_str) if limit_str and limit_str.isdigit() else None
        
        strawberries = trace_service.get_strawberry_list(status, limit)
        return success_response(strawberries, f'获取到 {len(strawberries)} 条草莓记录')
        
    except Exception as e:
        logger.error(f"获取草莓列表失败: {e}")
        return error_response(f"获取草莓列表失败: {str(e)}", 500)

@app.route('/api/strawberries', methods=['POST'])
def create_strawberry():
    """创建新草莓"""
    try:
        data = request.get_json() or {}
        notes = data.get('notes')
        custom_prefix = data.get('custom_prefix')
        
        strawberry = trace_service.create_new_strawberry(notes, custom_prefix)
        if strawberry:
            return success_response(strawberry, '草莓创建成功')
        else:
            return error_response('草莓创建失败', 500)
            
    except Exception as e:
        logger.error(f"创建草莓失败: {e}")
        return error_response(f"创建草莓失败: {str(e)}", 500)

@app.route('/api/strawberries/<int:strawberry_id>', methods=['GET'])
def get_strawberry(strawberry_id):
    """获取指定草莓的完整信息"""
    try:
        full_info = trace_service.get_strawberry_full_info(strawberry_id)
        if full_info:
            return success_response(full_info, '获取草莓信息成功')
        else:
            return error_response('草莓不存在', 404)
            
    except Exception as e:
        logger.error(f"获取草莓信息失败: {e}")
        return error_response(f"获取草莓信息失败: {str(e)}", 500)

@app.route('/api/strawberries/search', methods=['GET'])
def search_strawberry():
    """通过二维码搜索草莓"""
    try:
        qr_code = request.args.get('qr_code')
        if not qr_code:
            return error_response('请提供二维码内容')
        
        full_info = trace_service.search_strawberry_by_qr(qr_code)
        if full_info:
            return success_response(full_info, '找到草莓信息')
        else:
            return error_response('未找到匹配的草莓', 404)
            
    except Exception as e:
        logger.error(f"搜索草莓失败: {e}")
        return error_response(f"搜索草莓失败: {str(e)}", 500)

@app.route('/api/images/test')
def test_images():
    """测试图片目录和文件"""
    try:
        result = {
            'storage_images': [],
            'temp_uploads': [],
            'current_directory': os.getcwd()
        }
        
        # 检查 storage/images 目录
        storage_path = './storage/images'
        if os.path.exists(storage_path):
            for item in os.listdir(storage_path):
                item_path = os.path.join(storage_path, item)
                if os.path.isfile(item_path):
                    result['storage_images'].append({
                        'name': item,
                        'size': os.path.getsize(item_path),
                        'path': item_path,
                        'url': f"/api/images/{item}"
                    })
        
        # 检查 temp_uploads 目录
        temp_path = './temp_uploads'
        if os.path.exists(temp_path):
            for item in os.listdir(temp_path):
                item_path = os.path.join(temp_path, item)
                if os.path.isfile(item_path):
                    result['temp_uploads'].append({
                        'name': item,
                        'size': os.path.getsize(item_path),
                        'path': item_path,
                        'url': f"/api/images/{item}"
                    })
        
        return success_response(result, '图片目录检查完成')
        
    except Exception as e:
        logger.error(f"测试图片目录失败: {e}")
        return error_response(f"测试图片目录失败: {str(e)}", 500)

@app.route('/api/images/<path:image_path>')
def serve_image(image_path):
    """提供图片文件服务"""
    try:
        logger.info(f"请求图片: {image_path}")
        
        # 解码URL编码的路径
        from urllib.parse import unquote
        decoded_path = unquote(image_path)
        logger.info(f"解码后路径: {decoded_path}")
        
        # 统一路径分隔符，将反斜杠替换为正斜杠
        normalized_path = decoded_path.replace('\\', '/').replace('//', '/')
        logger.info(f"标准化路径: {normalized_path}")
        
        # 移除前导的 ./ 或 ./
        if normalized_path.startswith('./'):
            normalized_path = normalized_path[2:]
        elif normalized_path.startswith('.\\'):
            normalized_path = normalized_path[3:]
            
        logger.info(f"清理后路径: {normalized_path}")
        
        # 检查多个可能的图片目录
        possible_paths = [
            # 直接使用清理后的路径
            normalized_path,
            # 在当前目录下
            os.path.join('.', normalized_path),
            # 在storage/images目录下（只取文件名）
            os.path.join('./storage/images', os.path.basename(normalized_path)),
            # 在temp_uploads目录下
            os.path.join('./temp_uploads', os.path.basename(normalized_path)),
            # 原始路径处理
            image_path,
            decoded_path
        ]
        
        # 查找存在的文件
        for test_path in possible_paths:
            # 处理Windows路径
            full_path = os.path.normpath(test_path)
            logger.info(f"检查路径: {full_path}")
            
            if os.path.exists(full_path) and os.path.isfile(full_path):
                logger.info(f"找到图片文件: {full_path}")
                directory = os.path.dirname(full_path)
                filename = os.path.basename(full_path)
                
                # 如果目录为空，使用当前目录
                if not directory:
                    directory = '.'
                    
                return send_from_directory(directory, filename)
        
        # 如果都找不到，记录详细信息
        logger.warning(f"图片文件未找到: {image_path}")
        logger.warning(f"尝试的路径: {possible_paths}")
        
        # 返回默认图片或404错误
        return error_response('图片文件未找到', 404)
        
    except Exception as e:
        logger.error(f"提供图片文件失败: {e}")
        logger.error(f"错误详情: {str(e)}")
        return error_response('提供图片文件失败', 500)

@app.route('/api/photos/capture', methods=['POST'])
def capture_photo():
    """保存前端扫码截图到照片目录（不入库，仅保存文件）"""
    try:
        if 'image' not in request.files:
            return error_response('请上传图片文件')

        file = request.files['image']
        if file.filename == '':
            return error_response('请选择图片文件')

        if not allowed_file(file.filename):
            return error_response('不支持的文件格式，请上传 PNG、JPG、JPEG、GIF 或 BMP 格式的图片')

        original = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        new_filename = f"capture_{timestamp}_{original}"
        save_dir = app.config.get('PHOTO_STORAGE_PATH', './storage/photo')
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, new_filename)
        file.save(save_path)

        logger.info(f"保存扫码截图到: {save_path}")

        # 返回相对路径以便前端显示或记录
        rel_path = os.path.relpath(save_path, '.')
        return success_response({
            'filename': new_filename,
            'saved_path': rel_path
        }, '图片保存成功')
    except Exception as e:
        logger.error(f"保存扫码截图失败: {e}")
        logger.error(traceback.format_exc())
        return error_response('保存扫码截图失败', 500)

@app.route('/api/strawberries/<int:strawberry_id>/records', methods=['POST'])
def add_record(strawberry_id):
    """添加观察记录"""
    try:
        # strawberry_id 已从 URL 路径中获取
        if not strawberry_id:
            return error_response('草莓ID参数缺失')
        
        # 检查是否有文件上传
        if 'image' not in request.files:
            return error_response('请上传图片文件')
        
        file = request.files['image']
        if file.filename == '':
            return error_response('请选择图片文件')
        
        if not allowed_file(file.filename):
            return error_response('不支持的文件格式，请上传 PNG、JPG、JPEG、GIF 或 BMP 格式的图片')
        
        # 保存临时文件
        if not file.filename:
            return error_response('文件名不能为空')
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_filename = f"{timestamp}_{filename}"
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
        file.save(temp_path)
        
        # 获取表单数据
        growth_stage = request.form.get('growth_stage', '观察期')
        health_status = request.form.get('health_status', 'healthy')
        size_estimate = request.form.get('size_estimate', '')
        color_description = request.form.get('color_description', '')
        environment_conditions = request.form.get('environment_conditions', '')
        location = request.form.get('location', '')
        
        # AI自动生成描述（优先使用AI，如果失败则使用手动输入）
        manual_description = request.form.get('ai_description', '')
        notes = request.form.get('notes', '')
        ai_description = manual_description or notes or '无描述'  # 默认值
        generated_description = None  # 初始化变量
        
        if ai_service.is_enabled():
            logger.info(f"尝试使用AI生成描述: {temp_path}")
            generated_description = ai_service.generate_description(temp_path)
            if generated_description:
                logger.info("AI描述生成成功")
                ai_description = generated_description
            else:
                logger.warning("AI描述生成失败，使用备用描述")
        else:
            logger.info("AI服务未启用，使用手动输入的描述")
        
        # 如果有环境和位置信息，添加到AI描述中
        if environment_conditions or location:
            additional_info = []
            if environment_conditions:
                additional_info.append(f"环境条件: {environment_conditions}")
            if location:
                additional_info.append(f"位置: {location}")
            additional_text = "; ".join(additional_info)
            ai_description = ai_description + "\n" + additional_text if ai_description else additional_text
        
        # 添加记录
        record = trace_service.add_observation_record(
            strawberry_id, temp_path, ai_description, growth_stage,
            health_status, size_estimate, color_description
        )
        
        # 清理临时文件
        try:
            os.remove(temp_path)
        except:
            pass
        
        if record:
            response_data = record.copy()
            # 添加AI状态信息
            response_data['ai_enabled'] = ai_service.is_enabled()
            response_data['ai_generated'] = ai_service.is_enabled() and bool(generated_description)
            response_data['ai_description_used'] = ai_description
            
            return success_response(response_data, '观察记录添加成功')
        else:
            return error_response('添加观察记录失败', 500)
            
    except RequestEntityTooLarge:
        return error_response('文件太大，请上传小于16MB的文件', 413)
    except Exception as e:
        logger.error(f"添加观察记录失败: {e}")
        return error_response(f"添加观察记录失败: {str(e)}", 500)

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """获取统计信息"""
    try:
        stats = trace_service.get_statistics_report()
        if stats:
            return success_response(stats, '获取统计信息成功')
        else:
            return error_response('获取统计信息失败', 500)
            
    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        return error_response(f"获取统计信息失败: {str(e)}", 500)

@app.route('/api/strawberries/<int:strawberry_id>/export', methods=['GET'])
def export_strawberry_data(strawberry_id):
    """导出草莓数据"""
    try:
        format_type = request.args.get('format', 'json')
        
        exported_data = trace_service.export_strawberry_data(strawberry_id, format_type)
        if exported_data:
            return success_response({
                'data': exported_data,
                'format': format_type
            }, '数据导出成功')
        else:
            return error_response('导出数据失败', 500)
            
    except Exception as e:
        logger.error(f"导出数据失败: {e}")
        return error_response(f"导出数据失败: {str(e)}", 500)

@app.route('/api/strawberries/<int:strawberry_id>/delete', methods=['POST'])
def delete_strawberry(strawberry_id):
    """删除草莓记录"""
    try:
        success = trace_service.delete_strawberry_with_cleanup(strawberry_id)
        if success:
            return success_response(None, f'草莓记录(ID:{strawberry_id})已成功删除')
        else:
            return error_response(f'删除草莓记录(ID:{strawberry_id})失败', 500)
            
    except Exception as e:
        logger.error(f"删除草莓记录失败: {e}")
        return error_response(f"删除草莓记录失败: {str(e)}", 500)

@app.route('/api/strawberries/<int:strawberry_id>/records/<int:record_id>/delete', methods=['POST'])
def delete_record(strawberry_id, record_id):
    """删除草莓的单条记录"""
    try:
        # 先获取记录信息
        record = trace_service.dao.get_record_by_id(record_id)
        if not record or record['strawberry_id'] != strawberry_id:
            return error_response(f"记录 #{record_id} 不存在或不属于草莓 #{strawberry_id}", 404)
        
        # 删除记录相关的图片
        if record.get('image_path'):
            trace_service.image_manager.delete_image(record['image_path'])
        
        # 删除记录
        success = trace_service.dao.delete_record(record_id)
        if success:
            return success_response(None, f"记录 #{record_id} 已成功删除")
        else:
            return error_response(f"删除记录 #{record_id} 失败", 400)
    except Exception as e:
        logger.error(f"删除记录时出错: {e}")
        return error_response(f"删除记录时出错: {str(e)}", 500)

# 更新草莓状态
@app.route('/api/strawberries/<int:strawberry_id>/status', methods=['POST'])
def update_strawberry_status(strawberry_id):
    """更新草莓状态（例如设为死亡）"""
    try:
      data = request.get_json() or {}
      status = data.get('status')
      if not status:
          return error_response('缺少状态参数')
      allowed = {'active', 'inactive', 'harvested', 'dead'}
      if status not in allowed:
          return error_response('非法的状态值')
      success = trace_service.dao.update_strawberry_status(strawberry_id, status)
      if success:
          full_info = trace_service.get_strawberry_full_info(strawberry_id)
          return success_response(full_info, '草莓状态已更新')
      else:
          return error_response('更新草莓状态失败', 500)
    except Exception as e:
      logger.error(f"更新草莓状态失败: {e}")
      return error_response(f"更新草莓状态失败: {str(e)}", 500)

# === AI服务API ===

@app.route('/api/ai/config', methods=['GET'])
def get_ai_config():
    """获取AI配置"""
    try:
        config = ai_service.config.copy()
        # 隐藏API密钥的敏感信息
        if config.get('api_key'):
            config['api_key'] = '*' * len(config['api_key'])
        
        return success_response(config, '获取AI配置成功')
        
    except Exception as e:
        logger.error(f"获取AI配置失败: {e}")
        return error_response(f"获取AI配置失败: {str(e)}", 500)

@app.route('/api/ai/config', methods=['POST'])
def update_ai_config():
    """更新AI配置"""
    try:
        data = request.get_json() or {}
        
        # 如果API密钥是星号（表示前端获取的是隐藏后的密钥），则保持原有密钥不变
        if data.get('api_key') and all(c == '*' for c in data['api_key']):
            current_config = ai_service.config.copy()
            data['api_key'] = current_config.get('api_key', '')
        
        # 验证必要字段
        if 'enabled' in data and data['enabled']:
            if not data.get('api_key') or not data.get('provider'):
                return error_response('启用AI服务需要配置API密钥和提供商')
        
        # 更新配置
        success = ai_service.save_config(data)
        if success:
            return success_response(None, 'AI配置更新成功')
        else:
            return error_response('AI配置更新失败', 500)
            
    except Exception as e:
        logger.error(f"AI配置更新失败: {e}")
        return error_response(f"AI配置更新失败: {str(e)}", 500)

@app.route('/api/ai/test', methods=['POST'])
def test_ai_connection():
    """测试AI连接"""
    try:
        result = ai_service.test_connection()
        
        if result['success']:
            return success_response(result, 'AI连接测试成功')
        else:
            return error_response(result['message'], 400)
            
    except Exception as e:
        logger.error(f"AI连接测试失败: {e}")
        return error_response(f"AI连接测试失败: {str(e)}", 500)

@app.route('/api/ai/status', methods=['GET'])
def get_ai_status():
    """获取AI服务状态"""
    try:
        status = {
            'enabled': ai_service.is_enabled(),
            'provider': ai_service.config.get('provider', 'openai'),
            'has_api_key': bool(ai_service.config.get('api_key', '').strip())
        }
        return success_response(status, '获取AI状态成功')
        
    except Exception as e:
        logger.error(f"获取AI状态失败: {e}")
        return error_response(f"获取AI状态失败: {str(e)}", 500)

@app.route('/api/ai/analyze', methods=['POST'])
def analyze_image_with_ai():
    """使用AI分析图片"""
    try:
        # 检查AI服务是否启用
        if not ai_service.is_enabled():
            return error_response('AI服务未启用或配置不完整', 400)
        
        # 检查是否上传了文件
        if 'image' not in request.files:
            return error_response('请上传图片文件', 400)
        
        file = request.files['image']
        if file.filename == '':
            return error_response('请选择图片文件', 400)
        
        # 验证文件类型
        if not file.content_type.startswith('image/'):
            return error_response('文件类型不正确，请上传图片文件', 400)
        
        # 保存临时文件
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_filename = file.filename or 'unknown.jpg'
        filename = f"temp_ai_analyze_{timestamp}_{secure_filename(original_filename)}"
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)
        
        logger.info(f"手动AI分析图片: {temp_path}")
        
        # 使用AI生成描述
        description = ai_service.generate_description(temp_path)
        
        # 清理临时文件
        try:
            os.remove(temp_path)
        except:
            pass
        
        if description:
            return success_response({
                'description': description,
                'provider': ai_service.config.get('provider', 'openai')
            }, 'AI分析完成')
        else:
            return error_response('AI分析失败，请检查配置和网络连接', 500)
            
    except RequestEntityTooLarge:
        return error_response('文件太大，请上传小于16MB的文件', 413)
    except Exception as e:
        logger.error(f"AI分析失败: {e}")
        return error_response(f"AI分析失败: {str(e)}", 500)

# === 错误处理 ===

@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    return error_response('请求的资源不存在', 404)

@app.errorhandler(405)
def method_not_allowed(error):
    """405错误处理"""
    return error_response('请求方法不被允许', 405)

@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    logger.error(f"内部服务器错误: {error}")
    return error_response('内部服务器错误', 500)

@app.errorhandler(RequestEntityTooLarge)
def file_too_large(error):
    """文件过大错误处理"""
    return error_response('文件太大，请上传小于16MB的文件', 413)

# === 系统初始化 ===

def initialize_system():
    """初始化系统"""
    try:
        logger.info("正在初始化草莓溯源系统...")
        
        # 验证配置
        Config.validate_config()
        logger.info("配置验证通过")
        
        # 测试数据库连接
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        logger.info("系统初始化完成")
        return True
        
    except Exception as e:
        logger.error(f"系统初始化失败: {e}")
        return False

def main():
    """主函数"""
    print("🍓 草莓生长溯源系统 - Web服务器")
    print("=" * 50)
    
    # 初始化系统
    if not initialize_system():
        print("❌ 系统初始化失败，服务器无法启动")
        return 1
    
    print("✅ 系统初始化成功")
    
    # 配置运行参数
    host = os.getenv('WEB_HOST', '127.0.0.1')
    port = int(os.getenv('WEB_PORT', '5000'))
    debug = os.getenv('WEB_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 启动Web服务器...")
    print(f"   地址: http://{host}:{port}")
    print(f"   调试模式: {'开启' if debug else '关闭'}")
    print("=" * 50)
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
        return 0
    except Exception as e:
        logger.error(f"服务器启动失败: {e}")
        print(f"❌ 服务器启动失败: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
