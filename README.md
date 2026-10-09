# growth-mobile

乐学成长平台的移动端工程，使用 Expo、React Native 和 TypeScript，已包含学生与教师导航、登录注册、成长任务、目标、班级动态、个人资料及教师分析页面。

对应 Web 与后端工程：[pregrow](https://github.com/Seeleangel/pregrow)。

## 本地开发

```bash
npm ci
cp .env.example .env
# 填写自己的 Supabase URL、anon key 和后端 API 地址。
npm start
```

```bash
npm run android
npm run ios
npm run web
npx tsc --noEmit
npx expo export --platform web --output-dir dist-web
```

默认 API 地址指向本地 3003 端口。真机或模拟器需配置其可访问的后端地址。`EXPO_PUBLIC_*` 会进入客户端包，Supabase service key 应仅配置在后端。

## 源码结构

- `src/screens/`：学生、教师及认证页面。
- `src/navigation/`：导航结构。
- `src/services/`、`src/api/`：认证和服务调用。
- `src/config/`：应用配置。
- `src/components/`、`src/animations/`：组件与动画。
- `src/assets/`：界面插图。

已从关联此仓库的备份工程同步业务源码，排除了实际密钥、构建输出和开发助手记录。

## 当前验证状态

依赖安装和 Web 导出通过。TypeScript 检查仍有 30 个错误，涉及动画模块的导入、组件泛型及任务类型等；原生 Android / iOS、真实认证、后端读写及完整交互尚未验收。Web 导出成功不代表移动端已完成运行验收。
