/**
 * JSON到Markdown转换工具
 * 将AI分析返回的JSON格式转换为可读性更好的Markdown格式
 */

/**
 * 将JSON对象或字符串转换为Markdown格式
 * @param jsonData JSON对象或JSON字符串
 * @returns Markdown格式的字符串
 */
export function jsonToMarkdown(jsonData: unknown): string {
  // 如果输入是字符串，尝试解析为JSON对象
  let data: unknown;
  if (typeof jsonData === 'string') {
    try {
      data = JSON.parse(jsonData);
    } catch (e) {
      // 如果解析失败，可能不是有效的JSON字符串，直接返回原始内容
      return jsonData;
    }
  } else {
    data = jsonData;
  }

  // 如果解析后不是对象或数组，直接返回字符串形式
  if (typeof data !== 'object' || data === null) {
    return String(data);
  }

  return convertObjectToMarkdown(data, 0);
}

/**
 * 递归将对象转换为Markdown
 * @param obj 要转换的对象
 * @param depth 当前递归深度
 * @returns Markdown字符串
 */
function convertObjectToMarkdown(obj: Record<string, unknown> | unknown[], depth: number): string {
  if (Array.isArray(obj)) {
    return convertArrayToMarkdown(obj, depth);
  }

  let markdown = '';

  // 处理特殊情况：如果是草莓分析结果
  if (obj.growth_stage || obj.health_status || obj.diseases) {
    return formatStrawberryAnalysis(obj);
  }

  // 一般对象处理
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // 格式化键名为标题
      const formattedKey = formatKeyToTitle(key);
      
      if (typeof value === 'object' && value !== null) {
        // 对象或数组
        markdown += `${'#'.repeat(Math.min(depth + 2, 6))} ${formattedKey}\n\n`;
        markdown += convertObjectToMarkdown(value, depth + 1);
        markdown += '\n';
      } else {
        // 简单值
        markdown += `**${formattedKey}**: ${formatValue(value)}\n\n`;
      }
    }
  }

  return markdown;
}

/**
 * 将数组转换为Markdown列表
 * @param arr 要转换的数组
 * @param depth 当前递归深度
 * @returns Markdown字符串
 */
function convertArrayToMarkdown(arr: unknown[], depth: number): string {
  if (arr.length === 0) return '';

  let markdown = '';

  // 检查是否为简单值数组
  const isSimpleArray = arr.every(item => typeof item !== 'object' || item === null);

  if (isSimpleArray) {
    // 简单值数组转为无序列表
    arr.forEach(item => {
      markdown += `- ${formatValue(item)}\n`;
    });
    markdown += '\n';
  } else {
    // 复杂对象数组
    arr.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        markdown += `### 项目 ${index + 1}\n\n`;
        markdown += convertObjectToMarkdown(item, depth + 1);
        markdown += '\n';
      } else {
        markdown += `- ${formatValue(item)}\n`;
      }
    });
  }

  return markdown;
}

/**
 * 格式化键名为更可读的标题
 * @param key 原始键名
 * @returns 格式化后的标题
 */
function formatKeyToTitle(key: string): string {
  // 将下划线和连字符替换为空格
  let title = key.replace(/[_-]/g, ' ');
  
  // 首字母大写
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // 常见缩写全部大写
  title = title.replace(/\b(id|ai|api|url|uri|ui|ux)\b/gi, match => match.toUpperCase());
  
  return title;
}

/**
 * 格式化值
 * @param value 要格式化的值
 * @returns 格式化后的字符串
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '_无_';
  }
  
  if (typeof value === 'string') {
    // 如果字符串看起来像URL，将其格式化为链接
    if (/^(https?:\/\/|www\.)/i.test(value)) {
      return `[${value}](${value})`;
    }
    return value;
  }
  
  return String(value);
}

/**
 * 格式化草莓分析结果为更友好的Markdown
 * @param data 草莓分析数据
 * @returns 格式化后的Markdown
 */
function formatStrawberryAnalysis(data: Record<string, unknown>): string {
  let markdown = '';
  
  // 添加标题
  markdown += '# 草莓分析结果\n\n';
  
  // 基本信息部分
  if (data.growth_stage) {
    const growthStageMap: Record<string, string> = {
      'seedling': '幼苗期',
      'flowering': '开花期',
      'fruiting': '结果期',
      'ripening': '成熟期',
      'mature': '完全成熟期'
    };
    
    const stageName = growthStageMap[data.growth_stage] || data.growth_stage;
    markdown += `## 生长阶段\n\n**${stageName}**\n\n`;
  }
  
  if (data.health_status) {
    const healthStatusMap: Record<string, string> = {
      'healthy': '健康',
      'warning': '警告',
      'sick': '生病',
      'critical': '危急'
    };
    
    const statusName = healthStatusMap[data.health_status] || data.health_status;
    const statusEmoji = data.health_status === 'healthy' ? '✅ ' : 
                       data.health_status === 'warning' ? '⚠️ ' : 
                       data.health_status === 'sick' ? '🔴 ' : 
                       data.health_status === 'critical' ? '❗ ' : '';
    markdown += `## 健康状态\n\n**${statusEmoji}${statusName}**\n\n`;
  }
  
  // 疾病信息
  if (data.diseases && Array.isArray(data.diseases) && data.diseases.length > 0) {
    markdown += '## 检测到的疾病\n\n';
    
    data.diseases.forEach((disease: Record<string, unknown>) => {
      markdown += `### ${disease.name || '未知疾病'}\n\n`;
      
      if (disease.severity) {
        const severityBar = disease.severity <= 3 ? '🟢 轻度' : 
                          disease.severity <= 7 ? '🟠 中度' : '🔴 重度';
        markdown += `**严重程度**: ${disease.severity}/10 ${severityBar}\n\n`;
      }
      
      if (disease.symptoms && Array.isArray(disease.symptoms)) {
        markdown += '**症状**:\n\n';
        disease.symptoms.forEach((symptom: string) => {
          markdown += `- ${symptom}\n`;
        });
        markdown += '\n';
      }
      
      if (disease.treatment) {
        markdown += `**建议处理方法**: ${disease.treatment}\n\n`;
      }
    });
  }
  
  // 外观特征
  if (data.appearance) {
    markdown += '## 外观特征\n\n';
    
    if (data.appearance.color) {
      markdown += `**颜色**: ${data.appearance.color}\n\n`;
    }
    
    if (data.appearance.size) {
      markdown += `**大小**: ${data.appearance.size}\n\n`;
    }
    
    if (data.appearance.shape) {
      markdown += `**形状**: ${data.appearance.shape}\n\n`;
    }
    
    // 添加成熟度百分比显示
    if (data.appearance.ripeness_percentage !== undefined) {
      const percentage = data.appearance.ripeness_percentage;
      let progressBar = '';
      const filledBlocks = Math.round(percentage / 10);
      for (let i = 0; i < 10; i++) {
        progressBar += i < filledBlocks ? '🟥' : '⬜';
      }
      markdown += `**成熟度**: ${progressBar} ${percentage}%\n\n`;
    }
  }
  
  // 其他信息
  if (data.notes) {
    markdown += '## 附加说明\n\n';
    markdown += data.notes + '\n\n';
  }
  
  // 处理其他可能的字段
  const handledFields = ['growth_stage', 'health_status', 'diseases', 'appearance', 'notes'];
  for (const key in data) {
    if (!handledFields.includes(key) && Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== null && value !== undefined) {
        const formattedKey = formatKeyToTitle(key);
        
        if (typeof value === 'object') {
          markdown += `## ${formattedKey}\n\n`;
          markdown += convertObjectToMarkdown(value, 1);
          markdown += '\n';
        } else {
          markdown += `## ${formattedKey}\n\n${formatValue(value)}\n\n`;
        }
      }
    }
  }
  
  return markdown;
}