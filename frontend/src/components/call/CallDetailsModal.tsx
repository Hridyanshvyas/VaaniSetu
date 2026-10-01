import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius, shadows} from '../../theme/theme';

type Props = {
  bitsUsed: number;
  exchangesCount: number;
  savingsPct: string;
};

export function CallDetailsModal({
  bitsUsed,
  exchangesCount,
  savingsPct,
}: Props) {
  const {colors, isDark} = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <Pressable
        style={styles.headerPressable}
        onPress={() => setExpanded(!expanded)}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            Network & AI Technical Details
          </Text>
          <Text style={[styles.sub, {color: colors.textMuted}]}>
            {expanded
              ? 'Tap to collapse SIH technical metrics'
              : `${bitsUsed.toLocaleString()} bits · ${savingsPct}% data saved`}
          </Text>
        </View>
        <Text style={[styles.chevron, {color: colors.slateLight}]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.detailsSection, {borderTopColor: colors.borderLight}]}>
          {/* 3 Metric Columns */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, {color: colors.textPrimary}]}>
                {bitsUsed.toLocaleString()}
              </Text>
              <Text style={[styles.metricLbl, {color: colors.textMuted}]}>
                Bits Transmitted
              </Text>
            </View>

            <View style={[styles.divider, {backgroundColor: colors.borderLight}]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, {color: colors.successDark}]}>
                {savingsPct}%
              </Text>
              <Text style={[styles.metricLbl, {color: colors.textMuted}]}>
                Bandwidth Saved
              </Text>
            </View>

            <View style={[styles.divider, {backgroundColor: colors.borderLight}]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, {color: colors.textPrimary}]}>
                {exchangesCount}
              </Text>
              <Text style={[styles.metricLbl, {color: colors.textMuted}]}>
                Total Exchanges
              </Text>
            </View>
          </View>

          {/* Technical Specs List */}
          <View
            style={[
              styles.specsBox,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                borderColor: colors.borderLight,
              },
            ]}>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, {color: colors.textMuted}]}>Compression:</Text>
              <Text style={[styles.specVal, {color: colors.textPrimary}]}>6-Bit Bitstream + zlib</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, {color: colors.textMuted}]}>Error Correction:</Text>
              <Text style={[styles.specVal, {color: colors.textPrimary}]}>Reed-Solomon (255, 223)</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specKey, {color: colors.textMuted}]}>Audio Transport:</Text>
              <Text style={[styles.specVal, {color: colors.textPrimary}]}>0 bps (Text-only link)</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    ...shadows.card,
  },
  headerPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  sub: {
    fontSize: 10,
  },
  chevron: {
    fontSize: 11,
    paddingHorizontal: spacing.xs,
  },
  detailsSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  metricLbl: {
    fontSize: 9,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 22,
  },
  specsBox: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 3,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specKey: {
    fontSize: 10,
  },
  specVal: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semiBold,
  },
});
