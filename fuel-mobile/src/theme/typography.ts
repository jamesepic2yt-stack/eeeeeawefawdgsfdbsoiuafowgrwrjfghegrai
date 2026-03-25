import { Platform, TextStyle } from 'react-native';

/**
 * Fuel Design System — Typography
 *
 * Uses the system font stack for maximum performance and native feel.
 * Scale follows a 1.25 ratio (Major Third) for clear hierarchy.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  // ── Display ──────────────────────────────────────────────
  displayLarge: {
    fontFamily,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  // ── Headings ─────────────────────────────────────────────
  h1: {
    fontFamily,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.2,
  } as TextStyle,

  h2: {
    fontFamily,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  } as TextStyle,

  h3: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  } as TextStyle,

  // ── Body ─────────────────────────────────────────────────
  bodyLarge: {
    fontFamily,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,

  body: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  } as TextStyle,

  // ── Labels ───────────────────────────────────────────────
  label: {
    fontFamily,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  labelSmall: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,

  // ── Numeric (for macro values) ───────────────────────────
  numeric: {
    fontFamily: fontFamilyMono,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1,
  } as TextStyle,

  numericSmall: {
    fontFamily: fontFamilyMono,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
  } as TextStyle,

  // ── Caption ──────────────────────────────────────────────
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,
} as const;
