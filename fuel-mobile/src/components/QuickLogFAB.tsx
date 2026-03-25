/**
 * Quick Log floating action button.
 *
 * A pulsing amber button that opens a bottom sheet with three
 * logging modes: AI Scan, Barcode, and Manual Search.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import type { QuickLogMode } from '../types';

interface QuickLogFABProps {
  onSelect: (mode: QuickLogMode) => void;
}

const MODES: { key: QuickLogMode; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { key: 'scan', icon: 'scan-outline', label: 'AI Scan', desc: 'Point camera at food' },
  { key: 'barcode', icon: 'barcode-outline', label: 'Barcode', desc: 'Scan product UPC' },
  { key: 'search', icon: 'search-outline', label: 'Search', desc: 'Find in database' },
];

export function QuickLogFAB({ onSelect }: QuickLogFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scaleAnim = useSharedValue(1);
  const sheetAnim = useSharedValue(0);

  // Subtle pulse animation on the FAB
  React.useEffect(() => {
    scaleAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [scaleAnim]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sheetAnim.value, [0, 1], [300, 0]) }],
    opacity: sheetAnim.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: sheetAnim.value * 0.6,
  }));

  const open = useCallback(() => {
    setIsOpen(true);
    sheetAnim.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, [sheetAnim]);

  const close = useCallback(() => {
    sheetAnim.value = withTiming(0, { duration: 200 }, () => {});
    setTimeout(() => setIsOpen(false), 220);
  }, [sheetAnim]);

  const handleSelect = useCallback(
    (mode: QuickLogMode) => {
      close();
      setTimeout(() => onSelect(mode), 250);
    },
    [close, onSelect],
  );

  return (
    <>
      {/* FAB Button */}
      <Animated.View style={[styles.fabWrapper, fabStyle]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={open}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color={colors.text.inverse} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Sheet Modal */}
      <Modal visible={isOpen} transparent animationType="none">
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Animated.View style={[styles.overlayBg, overlayStyle]} />
        </Pressable>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Quick Log</Text>
          <Text style={styles.sheetSubtitle}>How would you like to log?</Text>

          <View style={styles.modesContainer}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={styles.modeCard}
                onPress={() => handleSelect(mode.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.modeIcon, { backgroundColor: colors.accent.primaryMuted }]}>
                  <Ionicons name={mode.icon} size={28} color={colors.accent.primary} />
                </View>
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={close}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85,
    alignSelf: 'center',
    zIndex: 100,
    // Glow shadow
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xxl,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.medium,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  modeCard: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modeLabel: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modeDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
