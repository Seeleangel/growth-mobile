// 用于调试配置问题的工具
import * as appConfig from '../config/app.config';

export const checkConfig = () => {
  const issues: string[] = [];

  console.log('=== 配置检查 ===');

  // 检查 Supabase URL
  if (!appConfig.SUPABASE_URL) {
    issues.push('❌ Supabase URL 未配置');
  } else {
    console.log('✅ Supabase URL:', appConfig.SUPABASE_URL);
  }

  // 检查 Supabase Key
  if (!appConfig.SUPABASE_ANON_KEY) {
    issues.push('❌ Supabase Anon Key 未配置');
  } else if (appConfig.SUPABASE_ANON_KEY.startsWith('sb_publishable_')) {
    issues.push('⚠️  Supabase Key 可能不正确 - 使用了占位符前缀');
  } else {
    console.log('✅ Supabase Key 已配置');
  }

  // 检查 API URL
  if (!appConfig.API_BASE_URL) {
    issues.push('❌ API URL 未配置');
  } else {
    console.log('✅ API URL:', appConfig.API_BASE_URL);
  }

  // 检查平台
  console.log('✅ 平台:', appConfig.appConfig.platform.os);
  console.log('✅ Web:', appConfig.isWeb);
  console.log('✅ Native:', appConfig.isNative);

  if (issues.length > 0) {
    console.error('\n=== 发现问题 ===');
    issues.forEach(issue => console.error(issue));
    console.log('\n解决方法：');
    console.log('1. 检查 app.json 文件中的 extra 配置');
    console.log('2. 确保 apiUrl, supabaseUrl, supabaseAnonKey 都已正确设置');
    console.log('3. 重启 expo 服务器');
  } else {
    console.log('\n✅ 所有配置检查通过！');
  }

  return issues;
};

// 在浏览器控制台中调用 checkConfig() 来运行检查
if (typeof window !== 'undefined') {
  (window as any).checkConfig = checkConfig;
  console.log('提示：在控制台中输入 checkConfig() 来检查配置');
}
