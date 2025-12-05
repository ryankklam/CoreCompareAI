# 编译并运行 CoreCompareAI 项目

## 项目概述
这是一个基于 React + TypeScript 的数据比较和迁移工具，使用 Vite 作为构建工具，依赖 Google Gemini AI 服务。

## 实施步骤

### 1. 创建环境变量文件
- 创建 `.env` 文件，添加 `GEMINI_API_KEY` 环境变量（用于 Google Gemini AI 服务）
- 注意：项目可能使用 mock 数据运行，但完整功能需要 API 密钥

### 2. 安装项目依赖
```bash
npm install
```

### 3. 编译并启动开发服务器
```bash
npm run dev
```
- 开发服务器将在 `http://localhost:3000` 启动
- 项目使用 Vite 构建，支持热更新

### 4. 验证项目运行
- 打开浏览器访问 `http://localhost:3000`
- 检查项目是否正常加载，功能是否可用

## 预期结果
- 项目成功编译并在本地运行
- 可以访问应用程序的各个功能模块
- 可以运行比较作业并查看结果

## 注意事项
- 如果没有 Google Gemini API 密钥，项目可能会使用 mock 数据运行
- 项目依赖于 Node.js 环境，请确保已安装 Node.js 18+ 版本