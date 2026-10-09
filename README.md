# growth-mobile

基于 Expo、React Native 和 TypeScript 的移动端项目骨架。

## 当前状态

当前代码保留 Expo 初始页面，尚未包含业务模块、后端服务或产品成效数据。此仓库作为移动端开发起点。

## 技术栈

- Expo 54
- React Native 0.81
- React 19
- TypeScript 5.9

具体依赖以 `package.json` 和 `package-lock.json` 为准。

## 本地运行

```bash
npm ci
npm run start
```

按需使用 `npm run android`、`npm run ios` 或 `npm run web`；对应平台需准备适用的运行环境。以上命令来自仓库脚本，本次文档整理未执行应用运行验证。

## 目录

- `App.tsx`：初始页面
- `index.ts`：应用入口
- `app.json`：Expo 配置
- `assets/`：应用图标及启动资源

## 后续补充

- 明确目标用户和首个核心流程
- 实现业务页面和数据管理
- 补充运行截图、测试和发布说明

[返回个人项目导航](https://github.com/Seeleangel)
