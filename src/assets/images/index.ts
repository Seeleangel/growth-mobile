/**
 * Centralized image registry.
 * All static images are require()'d here so Metro can bundle them.
 */

export const Images = {
  /** App icon – used on login / splash */
  appIcon: require('./APP启动图标.png'),
  /** Onboarding hero illustration */
  onboarding: require('./引导页插画.png'),
  /** Challenge-complete celebration */
  celebrate: require('./挑战完成庆祝.png'),
  /** Generic empty-state illustration */
  emptyState: require('./空状态插画.png'),
} as const;

export type ImageKey = keyof typeof Images;
