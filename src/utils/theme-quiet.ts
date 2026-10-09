/**
 * 内敛版主题配置 - Quiet Theme for React Native
 * 降低视觉强度，创造更精致的用户体验
 */

export const quietColors = {
  // 主色 - 柔和的鼠尾草绿
  primary: '#7a9e7a',
  primaryLight: '#a8c4a8',
  primaryDark: '#5a7a5a',
  primaryMuted: '#e8f0e8',

  // 中性色 - 温暖的灰褐色
  background: '#f9f7f3',
  surface: '#ffffff',
  surfaceDim: '#f5f3ef',
  surfaceAlt: '#faf9f6',

  // 文字色
  text: '#4a443c',
  textSecondary: '#7a7468',
  textTertiary: '#9a9488',
  textLight: '#b8b0a0',

  // 边框和分隔线
  border: '#e8e4dc',
  borderLight: '#f0ede6',

  // 功能色 - 降低饱和度
  accentYellow: '#d4c4a0',
  accentOrange: '#c9a87a',
  accentBlue: '#8ba3b8',
  accentRed: '#c98b8b',
  accentGreen: '#8fb98f',

  // AI 强调色
  aiAccent: '#8ba3b8',
  aiAccentLight: '#e8eef3',

  // 状态色
  success: '#7a9e7a',
  warning: '#d4c4a0',
  error: '#c98b8b',
  info: '#8ba3b8',

  // 透明遮罩
  overlay: 'rgba(42, 39, 34, 0.45)',

  // 深色模式
  dark: {
    background: '#2a2722',
    surface: '#35322c',
    surfaceDim: '#2f2c26',
    text: '#f0ebe3',
    textSecondary: '#b0a89c',
    border: '#454038',
  },
};

// 内敛版渐变
export const quietGradients = {
  // 移除鲜艳渐变，改用更柔和的
  primaryHero: ['#8aa88a', '#7a9e7a'] as const,
  primarySoft: ['#a8c4a8', '#7a9e7a'] as const,
  surface: ['#ffffff', '#f9f7f3'] as const,
  muted: ['#f5f3ef', '#e8e4dc'] as const,

  // 功能渐变
  success: ['#8fb98f', '#7a9e7a'] as const,
  warning: ['#d4c4a0', '#c9a87a'] as const,
};

// 内敛版阴影
export const quietShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#4a443c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#4a443c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#4a443c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#4a443c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  // 按钮按下状态
  pressed: {
    shadowColor: '#4a443c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
};

// 内敛版圆角
export const quietBorderRadius = {
  none: 0,
  sm: 6,
  DEFAULT: 10,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// 内敛版间距
export const quietSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

// 内敛版字体
export const quietTypography = {
  // 字号更克制
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
  },
  // 字重最高到600
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
  },
  // 行高
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// 内敛版动画配置
export const quietMotion = {
  // 更短的动画时长
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  // 柔和的缓动函数
  easing: {
    default: [0.4, 0, 0.2, 1], // ease-out-quart
    bounce: [0.34, 1.56, 0.64, 1], // 保留但少用
  },
  // 更微妙的缩放
  scale: {
    press: 0.98,
    hover: 1.02,
    tap: 0.98,
  },
  spring: {
    gentle: { damping: 20, stiffness: 300 },
    default: { damping: 15, stiffness: 400 },
    bouncy: { damping: 12, stiffness: 500 },
  },
};

// 玻璃拟态效果
export const quietGlass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(232, 228, 220, 0.5)',
  },
  dark: {
    backgroundColor: 'rgba(53, 50, 44, 0.72)',
    borderColor: 'rgba(69, 64, 56, 0.5)',
  },
};

// 导出完整的内敛主题
export const quietTheme = {
  colors: quietColors,
  gradients: quietGradients,
  shadows: quietShadows,
  borderRadius: quietBorderRadius,
  spacing: quietSpacing,
  typography: quietTypography,
  motion: quietMotion,
  glass: quietGlass,
};

export default quietTheme;
