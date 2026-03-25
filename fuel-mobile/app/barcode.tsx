/**
 * Barcode Scanner Screen
 *
 * Uses the device camera to scan UPC barcodes in real-time.
 * Matched products are looked up via OpenFoodFacts and displayed
 * with full macro details.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppState } from '../src/hooks/useAppState';
import { FoodCard } from '../src/components/FoodCard';
import { LogConfirmSheet } from '../src/components/LogConfirmSheet';
import * as api from '../src/services/api';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius, layout } from '../src/theme/spacing';
import type { FoodSearchResult, BarcodeResult } from '../src/types';

export default function BarcodeScreen() {
  const router = useRouter();
  const { logFood } = useAppState();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isLooking, setIsLooking] = useState(false);
  const [scannedResult, setScannedResult] = useState<BarcodeResult | null>(null);
  const [confirmFood, setConfirmFood] = useState<FoodSearchResult | null>(null);

  const handleBarCodeScanned = useCallback(
    async (scanResult: { data: string; type: string }) => {
      if (!isScanning || isLooking) return;

      setIsScanning(false);
      setIsLooking(true);

      try {
        const result = await api.lookupBarcode(scanResult.data);
        setScannedResult(result);
      } catch {
        Alert.alert('Lookup Failed', 'Could not look up barcode. Please try again.');
        setIsScanning(true);
      } finally {
        setIsLooking(false);
      }
    },
    [isScanning, isLooking],
  );

  const handleRescan = useCallback(() => {
    setScannedResult(null);
    setIsScanning(true);
  }, []);

  const handleLogConfirm = useCallback(
    async (food: FoodSearchResult, servings: number, mealType: string) => {
      await logFood(food, servings, mealType, 'barcode');
    },
    [logFood],
  );

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
          <Ionicons name="barcode-outline" size={64} color={colors.accent.primary} />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSubtitle}>
            Fuel needs camera access to scan product barcodes for instant nutritional lookup.
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
          <Text style={styles.topTitle}>Barcode Scanner</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera scanner */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          >
            {/* Scan line overlay */}
            <View style={styles.scanOverlay}>
              <View style={styles.scanWindow}>
                <View style={[styles.scanCorner, styles.topLeft]} />
                <View style={[styles.scanCorner, styles.topRight]} />
                <View style={[styles.scanCorner, styles.bottomLeft]} />
                <View style={[styles.scanCorner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanHint}>
                {isLooking ? 'Looking up product...' : 'Align barcode within frame'}
              </Text>
            </View>
          </CameraView>

          {isLooking && (
            <View style={styles.lookingOverlay}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={styles.lookingText}>Looking up product...</Text>
            </View>
          )}
        </View>

        {/* Result panel */}
        {scannedResult && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.resultPanel}>
            <View style={styles.resultHandle} />

            {scannedResult.found && scannedResult.product ? (
              <>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.semantic.success} />
                  <Text style={styles.resultTitle}>Product Found</Text>
                </View>
                <Text style={styles.barcodeLabel}>UPC: {scannedResult.barcode}</Text>

                <FoodCard
                  name={scannedResult.product.name}
                  brand={scannedResult.product.brand}
                  calories={scannedResult.product.calories}
                  protein={scannedResult.product.protein_g}
                  fat={scannedResult.product.fat_g}
                  carbs={scannedResult.product.carbs_g}
                  servingSize={scannedResult.product.serving_size}
                  servingUnit={scannedResult.product.serving_unit}
                  source="barcode"
                  onPress={() => setConfirmFood(scannedResult.product)}
                />

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.logBtn}
                    onPress={() => setConfirmFood(scannedResult.product)}
                  >
                    <Ionicons name="add-circle" size={20} color={colors.text.inverse} />
                    <Text style={styles.logBtnText}>Log This</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
                    <Text style={styles.rescanBtnText}>Scan Another</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.resultHeader}>
                  <Ionicons name="alert-circle" size={24} color={colors.semantic.warning} />
                  <Text style={styles.resultTitle}>Product Not Found</Text>
                </View>
                <Text style={styles.notFoundText}>
                  Barcode {scannedResult.barcode} is not in our database.
                  Try searching manually instead.
                </Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
                    <Text style={styles.rescanBtnText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={() => router.push('/search')}
                  >
                    <Text style={styles.searchBtnText}>Manual Search</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        )}

        <LogConfirmSheet
          food={confirmFood}
          visible={!!confirmFood}
          source="barcode"
          onClose={() => setConfirmFood(null)}
          onConfirm={handleLogConfirm}
        />
      </View>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

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
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanWindow: {
    width: 280,
    height: 160,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary,
    borderBottomRightRadius: 8,
  },
  scanHint: {
    ...typography.body,
    color: '#fff',
    marginTop: spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  lookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookingText: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },

  // Result panel
  resultPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xxl,
    paddingTop: spacing.md,
    maxHeight: '60%',
  },
  resultHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.medium,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  barcodeLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
  },
  notFoundText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  logBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  logBtnText: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  rescanBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  rescanBtnText: {
    ...typography.body,
    color: colors.text.primary,
  },
  searchBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primaryMuted,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  searchBtnText: {
    ...typography.body,
    color: colors.accent.primary,
    fontWeight: '600',
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
