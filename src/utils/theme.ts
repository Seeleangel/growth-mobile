/**
 * Premium Design System — 高级感 + 灵动感
 *
 * Design Principles:
 * 1. 高级感: 磨砂玻璃、微渐变、精致阴影层次、呼吸留白
 * 2. 灵动感: Spring 弹性、数字跳动、交互反馈、入场序列
 * 3. 一致性: Design Token 驱动，全局可控
 */
import { Platform, Dimensions, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// COLOR SYSTEM — 暖陶 × 柔沙 × 暖白底色
// ============================================================================
const palette = {
  // Brand Warm Terracotta (Primary)
  terracotta50:  '#FFF5F2',
  terracotta100: '#FDE8E1',
  terracotta200: '#FAD1C4',
  terracotta300: '#F4B3A1',
  terracotta400: '#EB927B',
  terracotta500: '#E07A5F',
  terracotta600: '#C96248',
  terracotta700: '#A64D36',
  terracotta800: '#853F2D',
  terracotta900: '#6E3628',
  terracotta950: '#3B1A12',

  // Warm Sand (Secondary)
  sand50:  '#FFFAF0',
  sand100: '#FEF0D8',
  sand200: '#FDE0B5',
  sand300: '#F9CC8D',
  sand400: '#F4B665',
  sand500: '#E9C46A',
  sand600: '#D4A373',

  // Coral
  coral300: '#FDA4AF',
  coral400: '#FB7185',
  coral500: '#F43F5E',

  // Sky
  sky300: '#7DD3FC',
  sky400: '#38BDF8',
  sky500: '#0EA5E9',

  // Violet
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',

  // Neutrals (Warm Gray/Brown)
  neutral0:   '#FFFFFF',
  neutral50:  '#FCF9F5',
  neutral100: '#F4EFEA',
  neutral200: '#E8DFD8',
  neutral300: '#D6C9C0',
  neutral400: '#B5A695',
  neutral500: '#8C7A6B',
  neutral600: '#6B5A4E',
  neutral700: '#4A403A',
  neutral800: '#332B27',
  neutral900: '#1F1A17',
  neutral950: '#0F0D0B',
};

export const colors = {
  primary:      palette.terracotta500,
  primaryDark:  palette.terracotta700,
  primaryLight: palette.terracotta100,
  primaryMuted: palette.terracotta50,

  secondary:      palette.sand500,
  secondaryDark:  palette.sand600,
  secondaryLight: palette.sand100,

  accent:      palette.violet500,
  accentLight: palette.violet300,
  accentOrange: palette.coral400,

  background:   palette.neutral50,
  surface:      palette.neutral0,
  surfaceDim:   palette.neutral100,
  surfaceAlt:   palette.neutral100,   // 替代面 — 输入框/卡片背景
  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  surfaceWarm:  palette.neutral100,

  text:          palette.neutral800,
  textSecondary: palette.neutral600,
  textTertiary:  palette.neutral400,
  textLight:     palette.neutral400,
  textMuted:     palette.neutral300,   // 占位文字/禁用文字
  textOnPrimary: '#FFFFFF',
  textOnDark:    '#FFFFFF',

  border:      palette.neutral200,
  borderLight: palette.neutral100,
  borderGlass: 'rgba(255, 255, 255, 0.28)',
  divider:     palette.neutral100,

  // 状态色
  disabled:     palette.neutral200,
  disabledText: palette.neutral400,

  // 遮罩色
  overlay:      'rgba(0, 0, 0, 0.45)',
  overlayDark:  'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',

  // AI 主题色 (Indigo)
  aiAccent:      '#6366F1',
  aiAccentLight: '#EEF2FF',
  aiAccentMuted: '#E0E7FF',

  // 骨架屏色
  skeletonBase:      palette.neutral100,
  skeletonHighlight: palette.neutral200,

  success: '#81B29A', // Muted Sage Green
  warning: palette.sand500,
  error:   palette.coral500,
  info:    palette.sky500,

  moodHappy:   '#F2CC8F',
  moodSad:     '#90A4AE',
  moodAngry:   palette.coral400,
  moodAnxious: palette.sand500,
  moodNeutral: palette.neutral400,

  levelBronze:   '#CD7F32',
  levelSilver:   '#B0BEC5',
  levelGold:     '#FFD700',
  levelPlatinum: '#90CAF9',
  levelDiamond:  '#CE93D8',

  palette,
};

// ============================================================================
// GRADIENTS
// ============================================================================
export const gradients = {
  primaryHero:    ['#E29578', '#E07A5F', '#C96248'] as const,
  primarySoft:    ['#FDE8E1', '#FFF5F2'] as const,
  primaryDark:    ['#853F2D', '#6E3628', '#3B1A12'] as const,

  goldShimmer:    ['#F4B665', '#E9C46A', '#D4A373'] as const,
  coralWarm:      ['#F43F5E', '#FB7185', '#FDA4AF'] as const,
  skyFresh:       ['#0EA5E9', '#38BDF8', '#7DD3FC'] as const,
  violetDream:    ['#8B5CF6', '#A78BFA', '#C4B5FD'] as const,

  successGlow:    ['#81B29A', '#A3C4B3'] as const,
  warningGlow:    ['#D4A373', '#E9C46A'] as const,
  errorGlow:      ['#E11D48', '#FB7185'] as const,

  meshLight:      ['#FFF5F2', '#FCF9F5', '#FEF0D8'] as const,
  meshCool:       ['#FFF5F2', '#F4EFEA', '#FDE8E1'] as const,

  glassWhite:     ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)'] as const,
  glassDark:      ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)'] as const,

  statStreak:     ['#E07A5F', '#E29578'] as const,
  statTasks:      ['#81B29A', '#A3C4B3'] as const,
  statBadges:     ['#E9C46A', '#F4B665'] as const,
};

// ============================================================================
// SPACING — 8pt Grid
// ============================================================================
export const spacing = {
  '2xs': 2,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const borderRadius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   24,
  '2xl':28,
  xxl:  28,   // alias for '2xl'
  '3xl':32,
  full: 9999,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const typography = {
  displayLg: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 40 },
  displaySm: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 34 },

  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
  h4: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },

  body:      { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },

  caption:   { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, letterSpacing: 0.2 },
  label:     { fontSize: 13, fontWeight: '600' as const, lineHeight: 16 },
  overline:  { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, lineHeight: 14 },
  button:    { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.3 },
  buttonSm:  { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2 },

  number:    { fontSize: 28, fontWeight: '800' as const, letterSpacing: -1 },
  numberSm:  { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.5 },
};

// ============================================================================
// SHADOWS
// ============================================================================
export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: palette.terracotta500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glowGold: {
    shadowColor: palette.sand400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  soft: {
    shadowColor: palette.neutral500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
};

// ============================================================================
// GLASS MORPHISM
// ============================================================================
export const glass: Record<string, ViewStyle> = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...(Platform.OS === 'web' ? {
      // @ts-ignore - web only
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } : {}),
  },
  frosted: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...(Platform.OS === 'web' ? {
      // @ts-ignore
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
    } : {}),
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web' ? {
      // @ts-ignore
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } : {}),
  },
};

// ============================================================================
// ANIMATION / MOTION PRESETS
// ============================================================================
export const motion = {
  duration: {
    instant: 120,
    fast:    200,
    normal:  350,
    slow:    500,
    grand:   800,
  },
  spring: {
    bouncy:  { damping: 8,  stiffness: 150, mass: 0.8 },
    smooth:  { damping: 15, stiffness: 120, mass: 1 },
    snappy:  { damping: 12, stiffness: 200, mass: 0.6 },
    gentle:  { damping: 20, stiffness: 100, mass: 1.2 },
    press:   { damping: 12, stiffness: 300, mass: 0.5 },
  },
  stagger: {
    fast:   40,
    normal: 70,
    slow:   120,
  },
  // 入场动画延迟序列 — 卡片由上到下依次出现
  enterDelay: {
    hero:    0,
    first:   80,
    second:  160,
    third:   240,
    fourth:  320,
    fifth:   400,
    item:    60,  // 列表项之间的 stagger
  },
};

// ============================================================================
// LAYOUT HELPERS
// ============================================================================
export const layout = {
  screenPadding: 20,
  cardPadding:   16,
  headerHeight:  Platform.OS === 'web' ? 56 : 48,
  tabBarHeight:  68,
  maxContentWidth: 480,
  isSmallScreen: SCREEN_WIDTH < 375,
};

// ============================================================================
// BACKWARD COMPATIBLE `theme` EXPORT
// ============================================================================
export const theme = {
  colors: {
    ...colors,
    background: colors.background,
    surface: colors.surface,
    surfaceWarm: colors.surfaceDim,
    surfaceAlt: colors.surfaceAlt,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textLight: colors.textTertiary,
    textMuted: colors.textMuted,
    textOnPrimary: colors.textOnPrimary,
    gradients: {
      primary: [colors.primary, colors.primaryDark],
      secondary: [colors.secondary, colors.secondaryDark],
      success: [colors.success, '#A3C4B3'],
      warm: [palette.sand300, palette.sand500],
      dark: [palette.neutral800, palette.neutral600],
    },
  },
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.lg,
    lg: spacing['2xl'],
    xl: spacing['3xl'],
    xxl: spacing['5xl'],
  },
  borderRadius: {
    sm: borderRadius.xs,
    md: borderRadius.sm,
    lg: borderRadius.lg,
    xl: borderRadius.xl,
    xxl: borderRadius['3xl'],
    full: borderRadius.full,
  },
  typography,
  shadows: {
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
    soft: shadows.soft,
    glow: shadows.glow,
  },
  animations: {
    fast: motion.duration.fast,
    normal: motion.duration.normal,
    slow: motion.duration.slow,
  },
};

export type Theme = typeof theme;
