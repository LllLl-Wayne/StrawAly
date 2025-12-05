-- 草莓生长溯源系统数据库建表语句
-- 数据库名称: strawberry_trace

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS strawberry_trace 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE strawberry_trace;

-- 1. 草莓信息表
-- 存储每颗草莓的基本信息和二维码信息
CREATE TABLE strawberries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '草莓唯一标识',
    qr_code VARCHAR(255) UNIQUE NOT NULL COMMENT '二维码内容',
    qr_code_path VARCHAR(500) COMMENT '二维码图片存储路径',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    status ENUM('active', 'inactive', 'harvested') DEFAULT 'active' COMMENT '草莓状态',
    notes TEXT COMMENT '备注信息',
    INDEX idx_qr_code (qr_code),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
COMMENT='草莓基本信息表';

-- 2. 草莓生长记录表
-- 存储每颗草莓的生长观察记录，包括照片和AI描述
CREATE TABLE strawberry_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录唯一标识',
    strawberry_id BIGINT NOT NULL COMMENT '草莓ID，关联strawberries表',
    image_path VARCHAR(500) NOT NULL COMMENT '照片存储路径',
    image_url VARCHAR(500) COMMENT '照片访问URL（可选）',
    ai_description TEXT COMMENT 'AI生成的生长状态描述',
    growth_stage ENUM('seedling', 'flowering', 'fruiting', 'ripening', 'mature') COMMENT '生长阶段',
    health_status ENUM('healthy', 'warning', 'sick') DEFAULT 'healthy' COMMENT '健康状态',
    size_estimate VARCHAR(50) COMMENT '大小估计',
    color_description VARCHAR(100) COMMENT '颜色描述',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (strawberry_id) REFERENCES strawberries(id) ON DELETE CASCADE,
    INDEX idx_strawberry_id (strawberry_id),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_growth_stage (growth_stage),
    INDEX idx_health_status (health_status)
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
COMMENT='草莓生长记录表';

-- 3. 系统日志表（可选）
-- 记录系统操作日志
CREATE TABLE system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    operation_type ENUM('create', 'update', 'delete', 'query') NOT NULL COMMENT '操作类型',
    table_name VARCHAR(50) NOT NULL COMMENT '操作的表名',
    record_id BIGINT COMMENT '操作的记录ID',
    operation_details TEXT COMMENT '操作详情',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_operation_type (operation_type),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci 
COMMENT='系统操作日志表';

-- 创建触发器：自动清理超过10条的历史记录
DELIMITER //

CREATE TRIGGER clean_old_records 
AFTER INSERT ON strawberry_records
FOR EACH ROW
BEGIN
    DECLARE record_count INT;
    
    -- 计算该草莓的记录数量
    SELECT COUNT(*) INTO record_count 
    FROM strawberry_records 
    WHERE strawberry_id = NEW.strawberry_id;
    
    -- 如果超过10条记录，删除最旧的记录
    IF record_count > 10 THEN
        DELETE FROM strawberry_records 
        WHERE strawberry_id = NEW.strawberry_id 
        AND id NOT IN (
            SELECT id FROM (
                SELECT id 
                FROM strawberry_records 
                WHERE strawberry_id = NEW.strawberry_id 
                ORDER BY recorded_at DESC 
                LIMIT 10
            ) AS recent_records
        );
    END IF;
END//

DELIMITER ;

-- 创建视图：草莓及其最新记录
CREATE VIEW strawberry_latest_view AS
SELECT 
    s.id,
    s.qr_code,
    s.qr_code_path,
    s.status as strawberry_status,
    s.notes,
    s.created_at as strawberry_created_at,
    r.id as latest_record_id,
    r.image_path as latest_image_path,
    r.ai_description as latest_ai_description,
    r.growth_stage as latest_growth_stage,
    r.health_status as latest_health_status,
    r.recorded_at as latest_recorded_at
FROM strawberries s
LEFT JOIN (
    SELECT 
        strawberry_id,
        id,
        image_path,
        ai_description,
        growth_stage,
        health_status,
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY strawberry_id ORDER BY recorded_at DESC) as rn
    FROM strawberry_records
) r ON s.id = r.strawberry_id AND r.rn = 1;

-- 插入示例数据（可选）
-- INSERT INTO strawberries (qr_code, notes) VALUES 
-- ('SB001_2024_001', '第一颗试验草莓'),
-- ('SB001_2024_002', '第二颗试验草莓');