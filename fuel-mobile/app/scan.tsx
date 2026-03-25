/**
 * AI Scan Screen
 *
 * Camera interface for food image recognition. Captures a photo,
 * sends it to the GPT-4 Vision backend, and displays identified
 * food components with estimated macros.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAppState } from '../src/hooks/useAppState';
import { LogConfirmSheet } from '../src/components/LogConfirmSheet';
import * as api from '../src/services/api';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, layout } from '../src/theme/spacing';
import type { VisionAnalysisResult, FoodSearchResult, FoodComponent } from '../src/types';

export default function ScanScreen() {
  const router = useRouter();
  const { logFood } = useAppState();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<FoodSearchResult | null>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo) {
        setCapturedUri(photo.uri);
        setIsAnalyzing(true);

        try {
          const analysis = await api.analyzeImage(photo.uri);
          setResult(analysis);
        } catch (err) {
          Alert.alert('Analysis Failed', 'Could not analyze the image. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not capture photo.');
    }
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
    setResult(null);
  }, []);

  const componentToFood = (comp: FoodComponent): FoodSearchResult => ({
    id: null,
    name: comp.name,
    brand: null,
    calories: comp.calories,
    protein_g: comp.protein_g,
    fat_g: comp.fat_g,
    carbs_g: comp.carbs_g,
    serving_size: null,
    serving_unit: comp.estimated_portion,
    barcode: null,
    source: 'scan',
    external_id: null,
    category: null,
  });

  const handleLogAll = useCallback(async () => {
    if (!result) return;
    const allFood: FoodSearchResult = {
      id: null,
      name: result.description,
      brand: null,
      calories: result.total_calories,
      protein_g: result.total_protein_g,
      fat_g: result.total_fat_g,
      carbs_g: result.total_carbs_g,
      serving_size: null,
      serving_unit: null,
      barcode: null,
      source: 'scan',
      external_id: null,
      category: null,
    };
    setSelectedComponent(allFood);
  }, [result]);

  const handleLogConfirm = useCallback(
    async (food: FoodSearchResult, servings: number, mealType: string) => {
      await logFood(food, servings, mealType, 'scan');
    },
    [logFood],
  );

  // Permission not granted
  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={colors.accent.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionScreen}>
          <Ionicons name="camera-outline" size={64} color={colors.accent.primary} />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSubtitle}>
            Fuel needs camera access to analyze food and estimate macros using AI vision.
          </Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>AI Food Scan</Text>
          <View style={{ width: 40 }} />
        </View>

        {!capturedUri ? (
          /* Camera viewfinder */
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            >
              {/* Viewfinder overlay */}
              <View style={styles.viewfinderOverlay}>
                <View style={styles.viewfinderCorner} />
                <Text style={styles.viewfinderText}>Point at your food</Text>
              </View>
            </CameraView>

            {/* Capture button */}
            <View style={styles.captureRow}>
              <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Analysis results */
          <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
            {/* Captured image preview */}
            <Image source={{ uri: capturedUri }} style={styles.previewImage} />

            {isAnalyzing ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.analyzingCard}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <Text style={styles.analyzingTitle}>Analyzing your meal...</Text>
                <Text style={styles.analyzingSubtitle}>
                  Identifying components and estimating macros
                </Text>
              </Animated.View>
            ) : result ? (
              <>
                {/* Analysis summary */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>{result.description}</Text>
                  <View style={styles.summaryMacros}>
                    <MacroLabel label="Cal" value={result.total_calories} color={colors.macro.calories} unit="kcal" />
                    <MacroLabel label="Pro" value={result.total_protein_g} color={colors.macro.protein} unit="g" />
                    <MacroLabel label="Fat" value={result.total_fat_g} color={colors.macro.fat} unit="g" />
                    <MacroLabel label="Carb" value={result.total_carbs_g} color={colors.macro.carbs} unit="g" />
                  </View>
                </Animated.View>

                {/* Individual components */}
                {result.components.map((comp, idx) => (
                  <Animated.View
                    key={idx}
                    entering={FadeInDown.duration(400).delay(idx * 100 + 200)}
                    style={styles.componentCard}
                  >
                    <TouchableOpacity onPress={() => setSelectedComponent(componentToFood(comp))}>
                      <View style={styles.componentHeader}>
                        <Text style={styles.componentName}>{comp.name}</Text>
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>
                            {Math.round(comp.confidence * 100)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.componentPortion}>{comp.estimated_portion}</Text>
                      <View style={styles.componentMacros}>
                        <Text style={[styles.componentMacro, { color: colors.macro.calories }]}>
                          {Math.round(comp.calories)} cal
                        </Text>
                        <Text style={[styles.componentMacro, { color: colors.macro.protein }]}>
                          {Math.round(comp.protein_g)}g P
                        </Text>
                        <Text style={[styles.componentMacro, { color: colors.macro.fat }]}>
                          {Math.round(comp.fat_g)}g F
                        </Text>
                        <Text style={[styles.componentMacro, { color: colors.macro.carbs }]}>
                          {Math.round(comp.carbs_g)}g C
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.logAllBtn} onPress={handleLogAll}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.text.inverse} />
                    <Text style={styles.logAllText}>Log Entire Meal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                    <Ionicons name="camera-outline" size={20} color={colors.text.primary} />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.errorCard}>
                <Ionicons name="warning-outline" size={32} color={colors.semantic.error} />
                <Text style={styles.errorText}>Analysis failed. Please try again.</Text>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                  <Text style={styles.retakeText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        <LogConfirmSheet
          food={selectedComponent}
          visible={!!selectedComponent}
          source="scan"
          onClose={() => setSelectedComponent(null)}
          onConfirm={handleLogConfirm}
        />
      </View>
    </SafeAreaView>
  );
}

function MacroLabel({ label, value, color, unit }: { label: string; value: number; color: string; unit: string }) {
  return (
    <View style={macroStyles.container}>
      <Text style={[macroStyles.value, { color }]}>{Math.round(value)}</Text>
      <Text style={macroStyles.unit}>{unit}</Text>
      <Text style={macroStyles.label}>{label}</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  value: { ...typography.numericSmall, fontSize: 22 },
  unit: { ...typography.caption, color: colors.text.tertiary },
  label: { ...typography.labelSmall, color: colors.text.secondary, marginTop: 2 },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },

  // Camera
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  viewfinderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderCorner: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderRadius: radius.xl,
    opacity: 0.6,
  },
  viewfinderText: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  captureRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },

  // Results
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  analyzingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  analyzingTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  analyzingSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  summaryTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  summaryMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  componentCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  componentName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  componentPortion: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  componentMacros: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  componentMacro: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  logAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  logAllText: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  retakeText: {
    ...typography.body,
    color: colors.text.primary,
  },
  errorCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Permission
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  permTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  permSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  permButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  permButtonText: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  backLink: {
    paddingVertical: spacing.md,
  },
  backLinkText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
