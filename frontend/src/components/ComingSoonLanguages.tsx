import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {UPCOMING_LANGUAGES} from '../config';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

export function ComingSoonLanguages() {
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
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
          More Languages
        </Text>
        <View style={[styles.badge, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}>
          <Text style={[styles.badgeText, {color: colors.textMuted}]}>ROADMAP</Text>
        </View>
      </View>

      <Text style={[styles.cardSub, {color: colors.textMuted}]}>
        Expanding neural models across 10 Indian languages.
      </Text>

      {/* 3-Column Grid with Disabled Visual Treatment */}
      <View style={styles.grid}>
        {UPCOMING_LANGUAGES.map(item => (
          <View
            key={item.code}
            style={[
              styles.langCard,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.borderLight,
              },
            ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.scriptText, {color: colors.textSecondary}]}>
                {item.script}
              </Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>

            <Text style={[styles.labelText, {color: colors.textMuted}]}>
              {item.label}
            </Text>

            <View style={[styles.soonBadge, {backgroundColor: colors.borderLight}]}>
              <Text style={[styles.soonText, {color: colors.textMuted}]}>Soon</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 10 Languages Vision Statement */}
      <View
        style={[
          styles.statementCard,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.borderLight,
          },
        ]}>
        <View style={styles.statCol}>
          <Text style={[styles.statNum, {color: colors.primary}]}>4</Text>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>Active</Text>
        </View>
        <Text style={[styles.statDivider, {color: colors.slateLight}]}>➔</Text>
        <View style={styles.statCol}>
          <Text style={[styles.statNum, {color: colors.textPrimary}]}>10</Text>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>Languages</Text>
        </View>
        <Text style={[styles.statDivider, {color: colors.slateLight}]}>➔</Text>
        <View style={styles.statCol}>
          <Text style={[styles.statNum, {color: colors.successDark}]}>∞</Text>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>Universal Voice</Text>
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
  cardTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  cardSub: {
    fontSize: typography.fontSizes.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  langCard: {
    width: '31%',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    opacity: 0.75,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  lockIcon: {
    fontSize: 9,
  },
  labelText: {
    fontSize: 10,
  },
  soonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    marginTop: 2,
  },
  soonText: {
    fontSize: 8.5,
    fontWeight: typography.fontWeights.semiBold,
  },
  statementCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.extraBold,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeights.medium,
  },
  statDivider: {
    fontSize: 10,
  },
});
