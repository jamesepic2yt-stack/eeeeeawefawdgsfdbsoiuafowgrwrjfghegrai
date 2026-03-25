/**
 * Fuel Design System — Spacing & Layout Tokens
 *
 * 4px grid system. Every spacing value is a multiple of 4
 * so components snap to a consistent visual rhythm.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const layout = {
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  bottomTabHeight: 80,
} as const;
