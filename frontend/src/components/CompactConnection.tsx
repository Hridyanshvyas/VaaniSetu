import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '../theme/theme';

type Props = {
  status: 'checking' | 'online' | 'offline';
  serverHost?: string;
  onRetry: () => void;
  isRetrying: boolean;
  onOpenAdvanced: () => void;
  onSelectPreset: (host: string) => void;
};

export function CompactConnection({
  status,
  serverHost = 'host:8080',
  onRetry,
  isRetrying,
  onOpenAdvanced,
  onSelectPreset,
}: Props) {
  const {colors} = useTheme();

  const isHost = serverHost.startsWith('host');
  const isJoin = serverHost.includes('43.1') || serverHost.includes(':8080') && !isHost;
  const isSolo = serverHost === 'offline';
  const isOnline = status === 'online' || isHost || isSolo;
  const isOffline = status === 'offline' && !isHost && !isSolo;

  const dotColor = isHost
    ? colors.primary
    : isJoin
    ? colors.success
    : isSolo
    ? colors.warning
    : isOnline
    ? colors.success
    : isOffline
    ? colors.error
    : colors.warning;

  const badgeBg = isHost
    ? colors.primaryLight
    : isJoin
    ? colors.successLight
    : isSolo
    ? colors.warningLight
    : isOnline
    ? colors.successLight
    : colors.errorLight;

  const textColor = isHost
    ? colors.primaryDark
    : isJoin
    ? colors.successDark
    : isSolo
    ? colors.warningDark
    : isOnline
    ? colors.successDark
    : colors.errorDark;

  const titleText = isHost
    ? '⚡ Offline Host (This Phone)'
    : isJoin
    ? '📲 Offline Client (Hotspot)'
    : isSolo
    ? '🎧 Solo Loopback Demo'
    : isOnline
    ? 'Server Online'
    : 'Server Offline';

  const subtitleText = isHost
    ? 'Turn on Mobile Hotspot · Partner connects to you'
    : isJoin
    ? 'Connect to Partner Phone’s Wi-Fi Hotspot'
    : isSolo
    ? '100% on-device single phone test'
    : isOnline
    ? 'VaaniSetu server connected'
    : 'Tap to configure connection';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isHost ? colors.primary : colors.border,
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={[styles.badge, {backgroundColor: badgeBg}]}>
            <View style={[styles.dot, {backgroundColor: dotColor}]} />
            <Text style={[styles.badgeText, {color: textColor}]}>{titleText}</Text>
          </View>
          <Text style={[styles.statusSub, {color: colors.textMuted}]}>
            {subtitleText}
          </Text>
        </View>

        <View style={styles.right}>
          {isRetrying ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Pressable
              style={[styles.configBtn, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}
              onPress={onOpenAdvanced}>
              <Text style={[styles.configBtnText, {color: colors.textSecondary}]}>⚙️ Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 3 Quick Mode Switcher Pills */}
      <View style={styles.modeRow}>
        <Pressable
          style={[
            styles.modeChip,
            {
              backgroundColor: isHost ? colors.primary : colors.surfaceSubtle,
              borderColor: isHost ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelectPreset('host:8080')}>
          <Text
            style={[
              styles.modeChipText,
              {color: isHost ? colors.white : colors.textPrimary},
            ]}>
            ⚡ Host Call
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.modeChip,
            {
              backgroundColor: isJoin ? colors.success : colors.surfaceSubtle,
              borderColor: isJoin ? colors.success : colors.border,
            },
          ]}
          onPress={() => onSelectPreset('192.168.43.1:8080')}>
          <Text
            style={[
              styles.modeChipText,
              {color: isJoin ? colors.white : colors.textPrimary},
            ]}>
            📲 Join Partner
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.modeChip,
            {
              backgroundColor: isSolo ? colors.primary : colors.surfaceSubtle,
              borderColor: isSolo ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelectPreset('offline')}>
          <Text
            style={[
              styles.modeChipText,
              {color: isSolo ? colors.white : colors.textPrimary},
            ]}>
            🎧 Solo Demo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
    gap: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  configBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  configBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  modeChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
