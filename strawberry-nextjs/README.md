# 草莓生长溯源系统 - Next.js版本

基于Next.js框架重新开发的现代化草莓生长溯源管理系统，采用了最新的Web技术栈，提供更好的用户体验和性能。

## 🚀 技术栈

- **前端框架**: Next.js 15.5.4 (App Router)
- **UI框架**: React 19.1.0
- **样式**: Tailwind CSS 4.0
- **动画**: Framer Motion
- **图标**: Heroicons
- **HTTP客户端**: Axios
- **数据获取**: SWR
- **类型检查**: TypeScript
- **代码规范**: ESLint

## ✨ 主要特性

### 🎨 现代化UI设计
- 采用玻璃拟态设计风格
- 响应式布局，支持移动端
- 流畅的动画效果
- 直观的用户交互

### ⚡ 性能优化
- **服务端渲染(SSR)**: 提升首屏加载速度
- **静态生成(SSG)**: 优化静态页面性能
- **代码分割**: 按需加载，减少包体积
- **图片优化**: Next.js Image组件自动优化

### 🔧 功能模块

#### 1. 仪表板 (`/`)
- 系统概览和统计数据
- 快速操作入口
- 实时数据更新

#### 2. 草莓管理 (`/strawberries`)
- 草莓列表查看和筛选
- 创建新草莓记录
- 详细信息查看

#### 3. 扫码记录 (`/scan`)
- 摄像头二维码扫描
- 手动输入二维码
- 添加观察记录

#### 4. 统计报告 (`/statistics`)
- 数据可视化图表
- 状态分布统计
- 生长阶段分析

#### 5. 系统设置 (`/settings`)
- AI服务配置
- 系统参数设置
- 连接测试功能

## 🛠️ 开发环境设置

### 前置要求
- Node.js 18.0+
- npm 或 yarn
- 后端API服务运行在 http://localhost:5000

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本
```bash
npm run build
npm start
```

## 📁 项目结构

```
strawberry-nextjs/
├── src/
│   ├── app/                    # App Router页面
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页(仪表板)
│   │   ├── strawberries/      # 草莓管理
│   │   ├── scan/              # 扫码记录
│   │   ├── statistics/        # 统计报告
│   │   └── settings/          # 系统设置
│   ├── components/            # 可复用组件
│   │   ├── ui/               # 基础UI组件
│   │   ├── layout/           # 布局组件
│   │   └── dashboard/        # 仪表板组件
│   └── lib/                  # 工具库
│       ├── api.ts           # API服务
│       └── utils.ts         # 工具函数
├── public/                   # 静态资源
├── next.config.ts           # Next.js配置
├── tailwind.config.ts       # Tailwind配置
└── tsconfig.json           # TypeScript配置
```

## 🔌 API集成

系统与后端API完全兼容，支持以下接口：

- `GET /api/health` - 健康检查
- `GET /api/strawberries` - 获取草莓列表
- `POST /api/strawberries` - 创建草莓
- `GET /api/strawberries/:id` - 获取草莓详情
- `GET /api/strawberries/search` - 搜索草莓
- `POST /api/strawberries/:id/records` - 添加观察记录
- `GET /api/statistics` - 获取统计数据
- `GET /api/ai/config` - 获取AI配置
- `POST /api/ai/config` - 更新AI配置
- `POST /api/ai/test` - 测试AI连接

## 🎯 核心优化

### 1. 性能优化
- 使用Next.js的自动代码分割
- 实现组件级懒加载
- 优化图片加载和缓存
- 减少不必要的重渲染

### 2. 用户体验
- 流畅的页面切换动画
- 实时的加载状态反馈
- 友好的错误处理
- 响应式设计适配

### 3. 开发体验
- TypeScript类型安全
- 组件化开发模式
- 统一的代码风格
- 完善的错误处理

## 🚀 部署

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 更新日志

### v2.0.0 (2025-09-25)
- 🎉 基于Next.js重新开发
- ✨ 现代化UI设计
- ⚡ 性能大幅提升
- 🔧 完整功能迁移
- 📱 移动端适配

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

MIT License