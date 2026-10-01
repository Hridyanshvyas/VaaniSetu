import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

type Props = {
  onStartDemo: () => void;
  disabled?: boolean;
};

export function QuickDemoCard({onStartDemo, disabled}: Props) {
  const {colors, isDark} = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.primaryLight,
          borderColor: colors.primaryBorder,
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, {backgroundColor: colors.primary}]}>
              <Text style={styles.badgeText}>⚡ QUICK DEMO</Text>
            </View>
            <Text style={[styles.sihTag, {color: colors.primary}]}>SIH 2026</Text>
          </View>
          <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
            Experience VaaniSetu in 1-Tap
          </Text>
          <Text style={[styles.cardSub, {color: colors.textSecondary}]}>
            Instant speech recognition, text compression, and translated synthesis demo.
          </Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.demoBtn,
          {backgroundColor: isDark ? colors.primary : colors.navySecondary},
          disabled && styles.btnDisabled,
        ]}
        onPress={onStartDemo}
        disabled={disabled}>
        {disabled ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.demoBtnText}>Try 1-Tap Demo</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    ...shadows.card,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: 0.5,
  },
  sihTag: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  cardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  cardSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  demoBtn: {
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.3,
  },
});
