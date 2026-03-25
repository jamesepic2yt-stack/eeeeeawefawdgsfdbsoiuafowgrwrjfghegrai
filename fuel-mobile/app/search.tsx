/**
 * Manual Search Screen
 *
 * Debounced search across the unified food database (USDA, OpenFoodFacts,
 * Nutritionix). Results appear as tappable FoodCards that open the
 * log confirmation sheet.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppState } from '../src/hooks/useAppState';
import { FoodCard } from '../src/components/FoodCard';
import { LogConfirmSheet } from '../src/components/LogConfirmSheet';
import * as api from '../src/services/api';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, layout } from '../src/theme/spacing';
import type { FoodSearchResult } from '../src/types';

const DEBOUNCE_MS = 400;

export default function SearchScreen() {
  const { logFood } = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [confirmFood, setConfirmFood] = useState<FoodSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const data = await api.searchFood(q.trim());
      setResults(data);
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => performSearch(text), DEBOUNCE_MS);
    },
    [performSearch],
  );

  const handleLogConfirm = useCallback(
    async (food: FoodSearchResult, servings: number, mealType: string) => {
      await logFood(food, servings, mealType, 'manual');
    },
    [logFood],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FoodSearchResult; index: number }) => (
      <Animated.View entering={FadeIn.duration(300).delay(index * 50)}>
        <FoodCard
          name={item.name}
          brand={item.brand}
          calories={item.calories}
          protein={item.protein_g}
          fat={item.fat_g}
          carbs={item.carbs_g}
          servingSize={item.serving_size}
          servingUnit={item.serving_unit}
          source={item.source}
          onPress={() => setConfirmFood(item)}
        />
      </Animated.View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Search header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search Foods</Text>
          <Text style={styles.subtitle}>USDA, restaurant menus & more</Text>
        </View>

        {/* Search input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search any food or brand..."
            placeholderTextColor={colors.text.tertiary}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Loading indicator */}
        {isSearching && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent.primary} />
            <Text style={styles.loadingText}>Searching databases...</Text>
          </View>
        )}

        {/* Results */}
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, idx) => `${item.source}-${item.external_id || idx}`}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            hasSearched && !isSearching ? (
              <View style={styles.emptyState}>
                <Ionicons name="nutrition-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            ) : !hasSearched && !isSearching ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>Find any food</Text>
                <Text style={styles.emptySubtitle}>
                  Search from millions of food products, restaurant items, and USDA entries
                </Text>
              </View>
            ) : null
          }
        />

        {/* Log confirmation */}
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
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    marginHorizontal: layout.screenPadding,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
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
    paddingHorizontal: spacing.xxxl,
  },
});
