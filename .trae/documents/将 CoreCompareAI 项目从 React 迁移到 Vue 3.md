# 将 CoreCompareAI 项目从 React 迁移到 Vue 3

## 项目概述
CoreCompareAI 是一个银行迁移工具，用于比较旧系统和新系统之间的数据差异。目前使用 React + TypeScript + Vite 构建，需要迁移到 Vue 3，保留所有功能并使用稳定版本的依赖。

## 迁移目标
- 将 React 代码迁移到 Vue 3
- 保留所有现有功能
- 使用稳定版本的依赖
- 保持相同的 UI/UX
- 保持 TypeScript 支持
- 保持 Vite 作为构建工具

## 技术栈对比

| React (当前) | Vue 3 (目标) |
|-------------|-------------|
| react@^19.2.0 | vue@^3.3.4 (稳定版) |
| react-dom@^19.2.0 | vue@^3.3.4 |
| @vitejs/plugin-react@^5.0.0 | @vitejs/plugin-vue@^4.4.0 |
| lucide-react@^0.555.0 | lucide-vue-next@^0.555.0 |
| React Context API | Pinia@^2.1.6 |
| React Hooks | Vue Composition API |

## 迁移步骤

### 1. 更新项目配置
- 修改 `package.json`，替换 React 依赖为 Vue 3 依赖
- 更新 `vite.config.ts`，使用 Vue 插件
- 更新 `index.html`，移除 React 相关脚本

### 2. 迁移类型定义
- 保留 `types.ts` 中的大部分类型定义
- 调整少量 React 特定类型

### 3. 迁移工具函数和常量
- 迁移 `constants.ts` 中的 mock 数据生成逻辑
- 迁移 `compareData` 和 `calculateStats` 等工具函数

### 4. 迁移状态管理
- 将 `LanguageContext` 迁移到 Pinia store
- 迁移其他 React Context (如果有)

### 5. 迁移组件
按照以下顺序迁移组件：
- `ExecutionPanel.vue`
- `Dashboard.vue`
- `ComparisonTable.vue`
- `App.vue` (主应用组件)

### 6. 迁移服务和 API
- 迁移 `geminiService.ts`
- 调整 API 调用逻辑以适应 Vue 3

### 7. 测试和验证
- 运行开发服务器，确保所有功能正常
- 检查类型错误
- 验证 UI/UX 与原项目一致

## 依赖版本选择
- Vue 3: ^3.3.4 (稳定版)
- Pinia: ^2.1.6 (稳定版)
- Vue Router: ^4.2.4 (稳定版，如需)
- Recharts: ^3.5.1 (与原版本相同，框架无关)
- Lucide Vue: ^0.555.0 (与原版本相同)
- @google/genai: ^1.30.0 (与原版本相同)
- TypeScript: ~5.8.2 (与原版本相同)
- Vite: ^6.2.0 (与原版本相同)

## 预期结果
- 项目成功从 React 迁移到 Vue 3
- 保留所有现有功能
- 使用稳定版本的依赖
- 保持良好的 TypeScript 支持
- 保持相同的 UI/UX

## 注意事项
- 迁移过程中保持代码结构清晰
- 遵循 Vue 3 最佳实践
- 确保所有组件和功能都经过测试
- 保持与原项目的兼容性