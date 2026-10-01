import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '../theme/theme';

export function Header() {
  const {isDark, colors, toggleTheme} = useTheme();

  return (
    <View style={styles.container}>
      {/* Top Row: AI Badge + Dark/Light Theme Toggle */}
      <View style={styles.topRow}>
        <View style={[styles.badge, {backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder}]}>
          <View style={[styles.badgePulseDot, {backgroundColor: colors.primary}]} />
          <Text style={[styles.badgeText, {color: colors.primary}]}>
            AI · LOW-BITRATE · VOICE BRIDGE
          </Text>
        </View>

        <Pressable
          style={[styles.themeToggleBtn, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}
          onPress={toggleTheme}
          accessibilityLabel="Toggle Dark/Light Mode">
          <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={[styles.themeToggleLabel, {color: colors.textSecondary}]}>
            {isDark ? 'Light' : 'Dark'}
          </Text>
        </Pressable>
      </View>

      {/* Main Brand Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.hindiTitle, {color: colors.textPrimary}]}>
          वाणी सेतु
        </Text>
        <Text style={[styles.englishTitle, {color: colors.primary}]}>
          VaaniSetu
        </Text>
      </View>

      {/* Primary & Secondary Taglines */}
      <Text style={[styles.primaryTagline, {color: colors.textPrimary}]}>
        Speak. Translate. Connect.
      </Text>
      <Text style={[styles.supportingTagline, {color: colors.textMuted}]}>
        AI-powered low-bandwidth voice communication across Indian languages
      </Text>

      {/* Eye-catching Voice Wave Visual Indicator */}
      <View style={styles.waveContainer}>
        <View style={[styles.waveBar, styles.wave1, {backgroundColor: colors.primaryLight}]} />
        <View style={[styles.waveBar, styles.wave2, {backgroundColor: colors.primaryBorder}]} />
        <View style={[styles.waveBar, styles.wave3, {backgroundColor: colors.primary}]} />
        <View style={[styles.waveBar, styles.wave4, {backgroundColor: colors.primaryBorder}]} />
        <View style={[styles.waveBar, styles.wave5, {backgroundColor: colors.primaryDark}]} />
        <View style={[styles.waveBar, styles.wave6, {backgroundColor: colors.primary}]} />
        <View style={[styles.waveBar, styles.wave7, {backgroundColor: colors.primaryBorder}]} />
        <View style={[styles.waveBar, styles.wave8, {backgroundColor: colors.primary}]} />
        <View style={[styles.waveBar, styles.wave9, {backgroundColor: colors.primaryBorder}]} />
        <View style={[styles.waveBar, styles.wave10, {backgroundColor: colors.primaryLight}]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    gap: 6,
    borderWidth: 1,
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    gap: 4,
  },
  themeToggleIcon: {
    fontSize: 12,
  },
  themeToggleLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semiBold,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  hindiTitle: {
    fontSize: typography.fontSizes.brand,
    fontWeight: typography.fontWeights.extraBold,
    lineHeight: typography.lineHeights.brand,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  englishTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1.5,
    marginTop: -4,
  },
  primaryTagline: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
  supportingTagline: {
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: typography.lineHeights.xs,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    marginTop: spacing.xs,
  },
  waveBar: {
    width: 3.5,
    borderRadius: borderRadius.pill,
  },
  wave1: { height: 8 },
  wave2: { height: 16 },
  wave3: { height: 26 },
  wave4: { height: 14 },
  wave5: { height: 22 },
  wave6: { height: 30 },
  wave7: { height: 16 },
  wave8: { height: 24 },
  wave9: { height: 12 },
  wave10: { height: 6 },
});
