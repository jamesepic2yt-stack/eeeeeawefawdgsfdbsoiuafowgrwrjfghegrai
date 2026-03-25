/**
 * Dashboard Screen — the heart of Fuel.
 *
 * Shows daily macro progress with animated rings, recent logs,
 * and the central Quick Log FAB. Designed for at-a-glance clarity:
 * one look tells you exactly where you stand for the day.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppState } from '../src/hooks/useAppState';
import { ProgressRing } from '../src/components/ProgressRing';
import { MacroBar } from '../src/components/MacroBar';
import { QuickLogFAB } from '../src/components/QuickLogFAB';
import { FoodCard } from '../src/components/FoodCard';
import { LogConfirmSheet } from '../src/components/LogConfirmSheet';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, layout } from '../src/theme/spacing';
import type { QuickLogMode, FoodSearchResult } from '../src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { state, refreshSummary, logFood, deleteLog } = useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const [confirmFood, setConfirmFood] = useState<FoodSearchResult | null>(null);

  const summary = state.summary;
  const user = state.user;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSummary();
    setRefreshing(false);
  }, [refreshSummary]);

  const handleQuickLog = useCallback(
    (mode: QuickLogMode) => {
      switch (mode) {
        case 'scan':
          router.push('/scan');
          break;
        case 'barcode':
          router.push('/barcode');
          break;
        case 'search':
          router.push('/search');
          break;
      }
    },
    [router],
  );

  const handleLogConfirm = useCallback(
    async (food: FoodSearchResult, servings: number, mealType: string) => {
      await logFood(food, servings, mealType, 'manual');
    },
    [logFood],
  );

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
            />
          }
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.userName}>{user?.name || 'Loading...'}</Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Calorie Ring — hero element */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.heroCard}>
            <View style={styles.heroRingRow}>
              <ProgressRing
                percentage={summary?.calories.percentage ?? 0}
                current={summary?.calories.current ?? 0}
                target={summary?.calories.target ?? 2000}
                color={colors.macro.calories}
                label="kcal"
                size={140}
                strokeWidth={10}
              />
              <View style={styles.heroStats}>
                <View style={styles.heroStatRow}>
                  <Text style={styles.heroStatValue}>
                    {Math.round((summary?.calories.target ?? 2000) - (summary?.calories.current ?? 0))}
                  </Text>
                  <Text style={styles.heroStatLabel}>remaining</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStatRow}>
                  <Text style={styles.heroStatValue}>{summary?.total_logs ?? 0}</Text>
                  <Text style={styles.heroStatLabel}>entries today</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Macro Rings Row */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.macroRingsRow}>
            <ProgressRing
              percentage={summary?.protein.percentage ?? 0}
              current={summary?.protein.current ?? 0}
              target={summary?.protein.target ?? 150}
              color={colors.macro.protein}
              label="protein"
              size={90}
              strokeWidth={7}
            />
            <ProgressRing
              percentage={summary?.fat.percentage ?? 0}
              current={summary?.fat.current ?? 0}
              target={summary?.fat.target ?? 65}
              color={colors.macro.fat}
              label="fat"
              size={90}
              strokeWidth={7}
            />
            <ProgressRing
              percentage={summary?.carbs.percentage ?? 0}
              current={summary?.carbs.current ?? 0}
              target={summary?.carbs.target ?? 250}
              color={colors.macro.carbs}
              label="carbs"
              size={90}
              strokeWidth={7}
            />
          </Animated.View>

          {/* Macro Bars (detailed) */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.barsCard}>
            <MacroBar
              label="Protein"
              current={summary?.protein.current ?? 0}
              target={summary?.protein.target ?? 150}
              color={colors.macro.protein}
            />
            <MacroBar
              label="Fat"
              current={summary?.fat.current ?? 0}
              target={summary?.fat.target ?? 65}
              color={colors.macro.fat}
            />
            <MacroBar
              label="Carbs"
              current={summary?.carbs.current ?? 0}
              target={summary?.carbs.target ?? 250}
              color={colors.macro.carbs}
            />
          </Animated.View>

          {/* Recent Logs */}
          <Animated.View entering={FadeInDown.duration(600).delay(500)}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            {summary && summary.logs.length > 0 ? (
              summary.logs.slice(0, 5).map((log) => (
                <FoodCard
                  key={log.id}
                  name={log.food_name}
                  brand={log.brand}
                  calories={log.calories}
                  protein={log.protein_g}
                  fat={log.fat_g}
                  carbs={log.carbs_g}
                  servingSize={log.serving_size}
                  servingUnit={log.serving_unit}
                  source={log.source}
                  mealType={log.meal_type}
                  timestamp={log.logged_at}
                  onDelete={() => deleteLog(log.id)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🍽</Text>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the + button to log your first meal
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Bottom padding for FAB */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Quick Log FAB */}
        <QuickLogFAB onSelect={handleQuickLog} />

        {/* Log confirmation sheet */}
        <LogConfirmSheet
          food={confirmFood}
          visible={!!confirmFood}
          source="manual"
          onClose={() => setConfirmFood(null)}
          onConfirm={handleLogConfirm}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  userName: {
    ...typography.displayMedium,
    color: colors.text.primary,
  },
  dateBadge: {
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Hero calorie section
  heroCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  heroRingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStats: {
    flex: 1,
    marginLeft: spacing.xxl,
  },
  heroStatRow: {
    marginVertical: spacing.sm,
  },
  heroStatValue: {
    ...typography.h1,
    color: colors.text.primary,
    fontSize: 28,
  },
  heroStatLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },

  // Macro rings
  macroRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },

  // Macro bars
  barsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  // Section
  sectionTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxxl,
  },
});
