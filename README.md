# MyAccount - 个人记账系统

一个简洁、清新的个人记账系统，用于管理个人收支记录及通过报表展示。

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- MySQL 8.0
- Maven

### 前端
- Angular 17
- TypeScript
- Chart.js + ng2-charts (图表)
- SCSS

## 功能特性

### 1. 记账表单
- 支持收入/支出类型切换
- 金额输入（支持小数）
- 快捷分类选择（带图标）
- 时间选择
- 账户选择（支付宝、微信、银行卡、现金、信用卡）
- 标签管理（支持添加、删除、常用标签快捷选择）
- 备注输入
- 快捷录入功能（预设常用收支项）

### 2. 报表页
- 时间范围筛选（今天、本周、本月、本年、自定义）
- 收支对比柱状图
- 分类占比饼图（支持收入/支出切换）
- 汇总卡片展示（总收入、总支出、结余）
- 分类明细列表

### 3. 收支详情列表
- 时间范围筛选
- 收支类型筛选
- 标签搜索
- 分页显示
- 编辑功能
- 删除功能
- 详细信息展示（分类、时间、账户、标签、备注）

## 项目结构

```
MyAccount/
├── backend/                    # 后端项目
│   ├── pom.xml                # Maven配置
│   └── src/
│       └── main/
│           ├── java/com/myaccount/
│           │   ├── MyAccountApplication.java    # 启动类
│           │   ├── config/                      # 配置类
│           │   ├── controller/                  # 控制器
│           │   ├── dto/                         # 数据传输对象
│           │   ├── entity/                      # 实体类
│           │   ├── exception/                   # 异常处理
│           │   ├── repository/                  # 数据访问层
│           │   └── service/                     # 业务逻辑层
│           └── resources/
│               └── application.yml              # 应用配置
├── frontend/                   # 前端项目
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── app.component.ts                # 根组件
│       │   ├── app.config.ts                   # 应用配置
│       │   ├── app.routes.ts                   # 路由配置
│       │   ├── components/                     # 组件
│       │   │   ├── transaction-form/           # 记账表单
│       │   │   ├── statistics/                 # 报表页
│       │   │   └── transaction-list/           # 明细列表
│       │   ├── models/                         # 数据模型
│       │   └── services/                       # 服务
│       ├── styles.scss                          # 全局样式
│       └── index.html
└── database/                   # 数据库脚本
    └── init.sql                 # 初始化脚本
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

### 1. 数据库初始化

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source database/init.sql
```

或者手动创建数据库：
```sql
CREATE DATABASE myaccount DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 配置数据库连接

编辑 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myaccount?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root      # 改为你的MySQL用户名
    password: root      # 改为你的MySQL密码
```

### 3. 启动后端

```bash
cd backend

# 使用Maven启动
mvn spring-boot:run

# 或者先打包再运行
mvn clean package
java -jar target/myaccount-1.0.0.jar
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端应用将在 `http://localhost:4200` 启动。

## API 接口

### 交易记录接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/transactions | 创建交易记录 |
| PUT | /api/transactions/{id} | 更新交易记录 |
| DELETE | /api/transactions/{id} | 删除交易记录 |
| GET | /api/transactions/{id} | 获取单个交易记录 |
| GET | /api/transactions | 分页查询交易记录 |
| GET | /api/transactions/statistics | 获取统计数据 |

### 辅助接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/transactions/tags | 获取所有标签 |
| GET | /api/transactions/categories?type={type} | 获取分类列表 |
| GET | /api/transactions/accounts | 获取账户列表 |

## 默认分类

### 收入分类
- 工资、奖金、投资收益、兼职收入、其他收入

### 支出分类
- 餐饮、交通、购物、娱乐、医疗、教育、住房、其他支出

## 默认账户
- 支付宝、微信、银行卡、现金、信用卡

## 开发说明

### 后端开发
- 使用 Spring Data JPA 进行数据访问
- 全局异常处理
- CORS 跨域配置
- 支持参数校验

### 前端开发
- Angular 17 独立组件模式
- 响应式表单
- Chart.js 图表库
- 响应式设计（支持移动端）

## 截图预览

### 记账表单
- 简洁的输入界面
- 快捷分类选择
- 常用收支快捷录入

### 报表页
- 直观的收支对比柱状图
- 分类占比饼图
- 实时数据更新

### 明细列表
- 清晰的列表展示
- 多条件筛选
- 分页浏览

## 后续优化建议

1. **用户系统**：添加登录注册功能，支持多用户
2. **数据导入导出**：支持 Excel/CSV 格式导入导出
3. **预算管理**：设置月度预算，超支提醒
4. **数据备份**：自动备份数据库
5. **主题切换**：支持深色/浅色主题
6. **更多图表**：添加趋势图、对比图等
7. **快捷记账**：支持语音输入、拍照识别

## License

MIT License
