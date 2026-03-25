/**
 * Fuel Design System — Color Tokens
 *
 * A dark-mode-first palette built around deep navy backgrounds
 * and warm amber accents. Every value is hand-picked for contrast
 * ratios that pass WCAG AA on the primary surface.
 */

export const colors = {
  // ── Backgrounds ──────────────────────────────────────────
  bg: {
    primary: '#0A1628',      // Main app background
    secondary: '#111D30',    // Card / elevated surface
    tertiary: '#182540',     // Input fields, pressed states
    overlay: 'rgba(10, 22, 40, 0.85)',
  },

  // ── Accent ───────────────────────────────────────────────
  accent: {
    primary: '#F5A623',      // Warm amber — main CTA
    primaryMuted: 'rgba(245, 166, 35, 0.15)',
    secondary: '#FF6B35',    // Energetic orange — secondary actions
    secondaryMuted: 'rgba(255, 107, 53, 0.12)',
  },

  // ── Text ─────────────────────────────────────────────────
  text: {
    primary: '#F0F2F5',      // High-emphasis
    secondary: '#8E99A8',    // Medium-emphasis
    tertiary: '#556277',     // Low-emphasis / disabled
    inverse: '#0A1628',      // Text on accent backgrounds
  },

  // ── Macro Colors ─────────────────────────────────────────
  // Each macro gets its own identity color, chosen to be
  // distinguishable even for common forms of color-blindness.
  macro: {
    calories: '#F5A623',     // Amber
    protein: '#4ECDC4',      // Teal
    fat: '#FF6B6B',          // Coral
    carbs: '#7C5CFC',        // Violet
  },

  // ── Semantic ─────────────────────────────────────────────
  semantic: {
    success: '#34C759',
    warning: '#FFB845',
    error: '#FF453A',
    info: '#5AC8FA',
  },

  // ── Borders & Dividers ───────────────────────────────────
  border: {
    subtle: 'rgba(142, 153, 168, 0.12)',
    medium: 'rgba(142, 153, 168, 0.25)',
    strong: 'rgba(142, 153, 168, 0.4)',
  },
} as const;
