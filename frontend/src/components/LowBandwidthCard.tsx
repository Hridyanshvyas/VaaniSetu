import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

export function LowBandwidthCard() {
  const {colors, isDark} = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.tag}>
          <Text style={[styles.tagText, {color: colors.primary}]}>
            ● ARCHITECTURE
          </Text>
        </View>
        <Text style={[styles.efficiencyText, {color: colors.successDark}]}>
          Ultra-Low Bitrate
        </Text>
      </View>

      <Text style={[styles.title, {color: colors.textPrimary}]}>
        Built for Low-Bandwidth Networks
      </Text>

      <Text style={[styles.description, {color: colors.textSecondary}]}>
        Traditional voice calls stream heavy audio. VaaniSetu recognizes speech locally, compresses text into high-density packets with Reed-Solomon Forward Error Correction (FEC), transmits over weak links, and synthesizes natural voice at the destination.
      </Text>

      {/* Pipeline Chain */}
      <View
        style={[
          styles.chainBox,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
            borderColor: colors.borderLight,
          },
        ]}>
        <View style={styles.chainRow}>
          <Text style={[styles.chainStep, {color: colors.textPrimary}]}>Speech</Text>
          <Text style={[styles.chainArrow, {color: colors.primary}]}>➔</Text>
          <Text style={[styles.chainStep, {color: colors.textPrimary}]}>Text</Text>
          <Text style={[styles.chainArrow, {color: colors.primary}]}>➔</Text>
          <Text style={[styles.chainStep, {color: colors.primary}]}>FEC + Packets</Text>
          <Text style={[styles.chainArrow, {color: colors.primary}]}>➔</Text>
          <Text style={[styles.chainStep, {color: colors.textPrimary}]}>Voice</Text>
        </View>
      </View>

      {/* Feature Badges */}
      <View style={styles.badgesRow}>
        <View style={[styles.badge, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}>
          <Text style={[styles.badgeLabel, {color: colors.textMuted}]}>6-Bit Bitstream</Text>
        </View>
        <View style={[styles.badge, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}>
          <Text style={[styles.badgeLabel, {color: colors.textMuted}]}>Reed-Solomon (255, 223)</Text>
        </View>
        <View style={[styles.badge, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}>
          <Text style={[styles.badgeLabel, {color: colors.textMuted}]}>Zero Audio Streaming</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    ...shadows.card,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: 0.5,
  },
  efficiencyText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  description: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  chainBox: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: 2,
  },
  chainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chainStep: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  chainArrow: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.medium,
  },
});
