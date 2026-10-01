import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../theme/theme';

type Props = {
  bitsUsed: number;
  savingsPct: string;
  exchangesCount: number;
};

export function CallMetricsCard({
  bitsUsed,
  savingsPct,
  exchangesCount,
}: Props) {
  const {colors} = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.metricItem}>
        <Text style={[styles.metricValue, {color: colors.textPrimary}]}>
          {bitsUsed.toLocaleString()}
        </Text>
        <Text style={[styles.metricLabel, {color: colors.textMuted}]}>
          Bits Sent
        </Text>
      </View>

      <View style={[styles.divider, {backgroundColor: colors.borderLight}]} />

      <View style={styles.metricItem}>
        <Text style={[styles.metricValue, {color: colors.successDark}]}>
          {savingsPct}%
        </Text>
        <Text style={[styles.metricLabel, {color: colors.textMuted}]}>
          Bandwidth Saved
        </Text>
      </View>

      <View style={[styles.divider, {backgroundColor: colors.borderLight}]} />

      <View style={styles.metricItem}>
        <Text style={[styles.metricValue, {color: colors.textPrimary}]}>
          {exchangesCount}
        </Text>
        <Text style={[styles.metricLabel, {color: colors.textMuted}]}>
          Exchanges
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1.5,
    ...shadows.card,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extraBold,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.semiBold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    width: 1,
    height: 28,
  },
});
