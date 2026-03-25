/**
 * History Screen
 *
 * Chronological view of all food logs. Grouped by date with
 * daily totals. Swipe-to-delete individual entries.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppState } from '../src/hooks/useAppState';
import { FoodCard } from '../src/components/FoodCard';
import * as api from '../src/services/api';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, layout } from '../src/theme/spacing';
import type { FoodLog } from '../src/types';

export default function HistoryScreen() {
  const { state, deleteLog } = useAppState();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!state.user) return;
    try {
      const data = await api.getLogs(state.user.id);
      setLogs(data);
    } catch {
      // silently fail
    }
  }, [state.user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, state.summary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const handleDelete = useCallback(
    async (logId: number) => {
      await deleteLog(logId);
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    },
    [deleteLog],
  );

  // Group logs by date
  const grouped = logs.reduce<Record<string, FoodLog[]>>((acc, log) => {
    const dateKey = new Date(log.logged_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  const sections = Object.entries(grouped);

  const totalCals = logs.reduce((sum, l) => sum + l.calories, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{Math.round(totalCals)}</Text>
            <Text style={styles.statLabel}>kcal total</Text>
          </View>
        </View>

        {sections.length > 0 ? (
          <FlatList
            data={sections}
            keyExtractor={([dateKey]) => dateKey}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent.primary}
              />
            }
            renderItem={({ item: [dateKey, dateLogs], index }) => {
              const dayCals = dateLogs.reduce((s, l) => s + l.calories, 0);
              return (
                <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{dateKey}</Text>
                    <Text style={styles.dayTotal}>{Math.round(dayCals)} kcal</Text>
                  </View>
                  {dateLogs.map((log) => (
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
                      onDelete={() => handleDelete(log.id)}
                    />
                  ))}
                </Animated.View>
              );
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={56} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Your logged meals will appear here
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  statBadge: {
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statValue: {
    ...typography.numericSmall,
    color: colors.macro.calories,
    fontSize: 16,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  dateText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  dayTotal: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
