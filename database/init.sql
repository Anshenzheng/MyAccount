-- 创建数据库
CREATE DATABASE IF NOT EXISTS myaccount DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myaccount;

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL COMMENT '金额',
    type VARCHAR(20) NOT NULL COMMENT '类型：income-收入，expense-支出',
    category VARCHAR(50) NOT NULL COMMENT '分类',
    transaction_time DATETIME NOT NULL COMMENT '交易时间',
    tags VARCHAR(100) COMMENT '标签，多个用逗号分隔',
    remark VARCHAR(500) COMMENT '备注',
    account VARCHAR(50) COMMENT '账户：支付宝、微信、银行卡等',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_transaction_time (transaction_time),
    INDEX idx_type (type),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易记录表';

-- 插入一些测试数据
INSERT INTO transactions (amount, type, category, transaction_time, tags, remark, account) VALUES
(25.50, 'expense', '餐饮', '2026-04-15 12:30:00', '午餐,外卖', '公司午餐', '微信'),
(15.00, 'expense', '交通', '2026-04-15 08:00:00', '地铁', '上班地铁费', '支付宝'),
(10000.00, 'income', '工资', '2026-04-10 09:00:00', '工资,4月', '4月份工资', '银行卡'),
(50.00, 'expense', '购物', '2026-04-14 19:00:00', '超市', '超市购物', '微信'),
(200.00, 'expense', '娱乐', '2026-04-13 20:00:00', '电影', '看电影', '支付宝'),
(5000.00, 'income', '奖金', '2026-04-05 10:00:00', '奖金,季度', '季度奖金', '银行卡'),
(80.00, 'expense', '餐饮', '2026-04-12 18:00:00', '晚餐,聚餐', '朋友聚餐', '微信'),
(30.00, 'expense', '交通', '2026-04-11 14:00:00', '打车', '打车去机场', '支付宝'),
(150.00, 'expense', '医疗', '2026-04-10 16:00:00', '药品', '购买感冒药', '微信'),
(2000.00, 'income', '兼职收入', '2026-04-08 15:00:00', '兼职,项目', '项目兼职收入', '银行卡');
