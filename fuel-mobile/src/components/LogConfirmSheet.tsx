/**
 * Bottom sheet for confirming a food log entry.
 *
 * Shows food details, allows adjusting servings and meal type,
 * then submits the log to the backend.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import type { FoodSearchResult } from '../types';

interface LogConfirmSheetProps {
  food: FoodSearchResult | null;
  visible: boolean;
  source: string;
  onClose: () => void;
  onConfirm: (food: FoodSearchResult, servings: number, mealType: string) => Promise<void>;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

export function LogConfirmSheet({ food, visible, source, onClose, onConfirm }: LogConfirmSheetProps) {
  const [servings, setServings] = useState('1');
  const [mealType, setMealType] = useState<string>('snack');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sheetAnim = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setServings('1');
      sheetAnim.value = withSpring(1, { damping: 20, stiffness: 200 });
    } else {
      sheetAnim.value = withTiming(0, { duration: 200 });
    }
  }, [visible, sheetAnim]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sheetAnim.value, [0, 1], [500, 0]) }],
    opacity: sheetAnim.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: sheetAnim.value * 0.6,
  }));

  if (!food) return null;

  const servingsNum = parseFloat(servings) || 1;
  const adjCal = food.calories * servingsNum;
  const adjPro = food.protein_g * servingsNum;
  const adjFat = food.fat_g * servingsNum;
  const adjCarbs = food.carbs_g * servingsNum;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(food, servingsNum, mealType);
      onClose();
    } catch {
      // Error handling could show an alert
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.overlayBg, overlayStyle]} />
      </Pressable>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle} />

        {/* Food info header */}
        <Text style={styles.title} numberOfLines={2}>{food.name}</Text>
        {food.brand ? <Text style={styles.brand}>{food.brand}</Text> : null}

        {/* Macro summary */}
        <View style={styles.macroGrid}>
          <MacroCell label="Calories" value={adjCal} unit="kcal" color={colors.macro.calories} />
          <MacroCell label="Protein" value={adjPro} unit="g" color={colors.macro.protein} />
          <MacroCell label="Fat" value={adjFat} unit="g" color={colors.macro.fat} />
          <MacroCell label="Carbs" value={adjCarbs} unit="g" color={colors.macro.carbs} />
        </View>

        {/* Servings input */}
        <View style={styles.servingsRow}>
          <Text style={styles.servingsLabel}>Servings</Text>
          <View style={styles.servingsControls}>
            <TouchableOpacity
              style={styles.servingsBtn}
              onPress={() => {
                const n = Math.max(0.5, servingsNum - 0.5);
                setServings(String(n));
              }}
            >
              <Ionicons name="remove" size={18} color={colors.text.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.servingsInput}
              value={servings}
              onChangeText={setServings}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.servingsBtn}
              onPress={() => {
                const n = servingsNum + 0.5;
                setServings(String(n));
              }}
            >
              <Ionicons name="add" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meal type selector */}
        <Text style={styles.sectionLabel}>Meal</Text>
        <View style={styles.mealRow}>
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.mealBtn, mealType === type && styles.mealBtnActive]}
              onPress={() => setMealType(type)}
            >
              <Ionicons
                name={MEAL_ICONS[type]}
                size={18}
                color={mealType === type ? colors.accent.primary : colors.text.tertiary}
              />
              <Text style={[styles.mealBtnText, mealType === type && styles.mealBtnTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, isSubmitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={colors.text.inverse} />
              <Text style={styles.confirmText}>Log {Math.round(adjCal)} kcal</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

function MacroCell({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.macroCell}>
      <Text style={[styles.macroCellValue, { color }]}>{Math.round(value)}</Text>
      <Text style={styles.macroCellUnit}>{unit}</Text>
      <Text style={styles.macroCellLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.medium,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  brand: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  macroCell: {
    alignItems: 'center',
  },
  macroCellValue: {
    ...typography.numericSmall,
    fontSize: 22,
  },
  macroCellUnit: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  macroCellLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  servingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  servingsLabel: {
    ...typography.h3,
    color: colors.text.primary,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  servingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsInput: {
    ...typography.numericSmall,
    color: colors.text.primary,
    textAlign: 'center',
    width: 60,
    paddingVertical: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  sectionLabel: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  mealRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  mealBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mealBtnActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryMuted,
  },
  mealBtnText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  mealBtnTextActive: {
    color: colors.accent.primary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    ...typography.h3,
    color: colors.text.inverse,
  },
});
