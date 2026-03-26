/**
 * Profile & Settings Screen
 *
 * Allows users to view/edit their profile, update daily macro targets,
 * and configure app preferences.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppState } from '../src/hooks/useAppState';
import * as api from '../src/services/api';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, layout } from '../src/theme/spacing';

export default function ProfileScreen() {
  const { state, initUser } = useAppState();
  const user = state.user;

  const [name, setName] = useState(user?.name || '');
  const [calories, setCalories] = useState(String(user?.target_calories || 2000));
  const [protein, setProtein] = useState(String(user?.target_protein_g || 150));
  const [fat, setFat] = useState(String(user?.target_fat_g || 65));
  const [carbs, setCarbs] = useState(String(user?.target_carbs_g || 250));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCalories(String(user.target_calories));
      setProtein(String(user.target_protein_g));
      setFat(String(user.target_fat_g));
      setCarbs(String(user.target_carbs_g));
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await api.updateUser(user.id, { name });
      await api.updateTargets(user.id, {
        target_calories: parseFloat(calories) || 2000,
        target_protein_g: parseFloat(protein) || 150,
        target_fat_g: parseFloat(fat) || 65,
        target_carbs_g: parseFloat(carbs) || 250,
      });
      await initUser();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, name, calories, protein, fat, carbs, initUser]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.title}>Profile</Text>
          </Animated.View>

          {/* Avatar / Identity */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.email}>{user?.email || 'Loading...'}</Text>
          </Animated.View>

          {/* Name */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={styles.sectionTitle}>Display Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </Animated.View>

          {/* Daily Targets */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={styles.sectionTitle}>Daily Macro Targets</Text>
            <Text style={styles.sectionSubtitle}>
              Set your personalized daily goals. These drive the progress rings on your dashboard.
            </Text>

            <TargetInput
              label="Calories"
              value={calories}
              onChangeText={setCalories}
              unit="kcal"
              color={colors.macro.calories}
              icon="flame-outline"
            />
            <TargetInput
              label="Protein"
              value={protein}
              onChangeText={setProtein}
              unit="g"
              color={colors.macro.protein}
              icon="fitness-outline"
            />
            <TargetInput
              label="Fat"
              value={fat}
              onChangeText={setFat}
              unit="g"
              color={colors.macro.fat}
              icon="water-outline"
            />
            <TargetInput
              label="Carbs"
              value={carbs}
              onChangeText={setCarbs}
              unit="g"
              color={colors.macro.carbs}
              icon="nutrition-outline"
            />
          </Animated.View>

          {/* Save button */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.text.inverse} />
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* App info */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.appInfo}>
            <View style={styles.logoRow}>
              <Ionicons name="flame" size={24} color={colors.accent.primary} />
              <Text style={styles.appName}>Fuel</Text>
            </View>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appTagline}>Track what fuels you</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TargetInput({
  label,
  value,
  onChangeText,
  unit,
  color,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={targetStyles.container}>
      <View style={targetStyles.labelRow}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={targetStyles.label}>{label}</Text>
      </View>
      <View style={targetStyles.inputRow}>
        <TextInput
          style={targetStyles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <Text style={targetStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const targetStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    ...typography.numericSmall,
    color: colors.text.primary,
    textAlign: 'right',
    width: 80,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  unit: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    width: 30,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xxl,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  avatarText: {
    ...typography.displayLarge,
    color: colors.accent.primary,
  },
  email: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },

  // Sections
  sectionTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  // Name input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xxl,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typography.h3,
    color: colors.text.inverse,
  },

  // App info
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.xxxxl,
    paddingTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  appName: {
    ...typography.h1,
    color: colors.text.primary,
  },
  appVersion: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
