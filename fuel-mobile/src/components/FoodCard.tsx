/**
 * Food item card used in search results and log history.
 *
 * Shows food name, brand, serving info, and a macro summary strip.
 * Tapping opens the log confirmation flow.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface FoodCardProps {
  name: string;
  brand?: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingSize?: number | null;
  servingUnit?: string | null;
  source?: string;
  onPress?: () => void;
  onDelete?: () => void;
  mealType?: string;
  timestamp?: string;
}

const SOURCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  usda: 'leaf-outline',
  openfoodfacts: 'globe-outline',
  nutritionix: 'restaurant-outline',
  scan: 'camera-outline',
  barcode: 'barcode-outline',
  manual: 'create-outline',
};

export function FoodCard({
  name,
  brand,
  calories,
  protein,
  fat,
  carbs,
  servingSize,
  servingUnit,
  source,
  onPress,
  onDelete,
  mealType,
  timestamp,
}: FoodCardProps) {
  const servingText =
    servingSize && servingUnit
      ? `${servingSize}${servingUnit}`
      : null;

  const sourceIcon = SOURCE_ICONS[source || 'manual'] || 'nutrition-outline';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.sourceIcon}>
          <Ionicons name={sourceIcon} size={16} color={colors.text.secondary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          {brand ? <Text style={styles.brand} numberOfLines={1}>{brand}</Text> : null}
          <View style={styles.metaRow}>
            {servingText ? (
              <Text style={styles.meta}>{servingText}</Text>
            ) : null}
            {mealType ? (
              <View style={styles.mealBadge}>
                <Text style={styles.mealText}>{mealType}</Text>
              </View>
            ) : null}
            {timestamp ? (
              <Text style={styles.meta}>
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.calBlock}>
          <Text style={styles.calValue}>{Math.round(calories)}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>
        {onDelete ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Macro strip */}
      <View style={styles.macroStrip}>
        <MacroChip label="P" value={protein} color={colors.macro.protein} />
        <MacroChip label="F" value={fat} color={colors.macro.fat} />
        <MacroChip label="C" value={carbs} color={colors.macro.carbs} />
      </View>
    </TouchableOpacity>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '30' }]}>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
      <Text style={styles.chipValue}>{Math.round(value)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  brand: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  mealBadge: {
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  mealText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calBlock: {
    alignItems: 'flex-end',
  },
  calValue: {
    ...typography.numericSmall,
    color: colors.macro.calories,
    fontSize: 20,
  },
  calUnit: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  deleteBtn: {
    marginLeft: spacing.sm,
    marginTop: 4,
  },
  macroStrip: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 4,
  },
  chipLabel: {
    ...typography.labelSmall,
    fontSize: 10,
  },
  chipValue: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
