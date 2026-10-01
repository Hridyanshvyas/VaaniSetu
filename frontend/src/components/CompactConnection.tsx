import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '../theme/theme';

type Props = {
  status: 'checking' | 'online' | 'offline';
  onRetry: () => void;
  isRetrying: boolean;
  onOpenAdvanced: () => void;
};

export function CompactConnection({
  status,
  onRetry,
  isRetrying,
  onOpenAdvanced,
}: Props) {
  const {colors} = useTheme();

  const isOnline = status === 'online';
  const isOffline = status === 'offline';

  const dotColor = isOnline
    ? colors.success
    : isOffline
    ? colors.error
    : colors.warning;

  const badgeBg = isOnline
    ? colors.successLight
    : isOffline
    ? colors.errorLight
    : colors.warningLight;

  const textColor = isOnline
    ? colors.successDark
    : isOffline
    ? colors.errorDark
    : colors.warningDark;

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.surface, borderColor: colors.border},
      ]}>
      <View style={styles.left}>
        <View style={[styles.badge, {backgroundColor: badgeBg}]}>
          <View style={[styles.dot, {backgroundColor: dotColor}]} />
          <Text style={[styles.badgeText, {color: textColor}]}>
            {isOnline ? 'Connected' : isOffline ? 'Offline' : 'Checking…'}
          </Text>
        </View>
        <Text style={[styles.statusSub, {color: colors.textMuted}]}>
          {isOnline
            ? 'VaaniSetu server ready'
            : isOffline
            ? 'Server unreachable'
            : 'Connecting to server…'}
        </Text>
      </View>

      <View style={styles.right}>
        {isOffline && (
          <Pressable
            style={[styles.retryBtn, {backgroundColor: colors.errorLight, borderColor: colors.error}]}
            onPress={onRetry}
            disabled={isRetrying}>
            {isRetrying ? (
              <ActivityIndicator size="small" color={colors.errorDark} />
            ) : (
              <Text style={[styles.retryText, {color: colors.errorDark}]}>Retry</Text>
            )}
          </Pressable>
        )}

        <Pressable
          style={[styles.settingsBtn, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}
          onPress={onOpenAdvanced}
          accessibilityLabel="Advanced Settings">
          <Text style={[styles.settingsText, {color: colors.textSecondary}]}>⚙ Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  statusSub: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  settingsBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  settingsText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semiBold,
  },
});
