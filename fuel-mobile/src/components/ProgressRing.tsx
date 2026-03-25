/**
 * Animated circular progress ring for macro tracking.
 *
 * Uses react-native-svg with Reanimated for smooth fill animations.
 * The ring animates from 0 to the target percentage on mount and
 * whenever the value changes.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0–100 percentage filled */
  percentage: number;
  /** Current numeric value (displayed in center) */
  current: number;
  /** Target numeric value */
  target: number;
  /** Ring stroke color */
  color: string;
  /** Label shown below the number (e.g., "kcal", "protein") */
  label: string;
  /** Outer diameter in points */
  size?: number;
  /** Ring stroke width */
  strokeWidth?: number;
}

export function ProgressRing({
  percentage,
  current,
  target,
  color,
  label,
  size = 120,
  strokeWidth = 8,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedPct = Math.min(percentage, 100);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clampedPct / 100, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedPct, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.bg.tertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated fill */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.value, { color }]} numberOfLines={1}>
          {Math.round(current)}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    ...typography.numericSmall,
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
