import React, {useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

type Status = 'checking' | 'online' | 'offline';

type Props = {
  status: Status;
  statusDetail: string;
  serverHost: string;
  onRetry: () => void;
  isRetrying: boolean;
};

export function ConnectionStatusCard({
  status,
  statusDetail,
  serverHost,
  onRetry,
  isRetrying,
}: Props) {
  const {colors} = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const statusBadgeConfig = {
    online: {
      label: 'Connected',
      dotColor: colors.success,
      bgColor: colors.successLight,
      textColor: colors.successDark,
    },
    offline: {
      label: 'Offline',
      dotColor: colors.error,
      bgColor: colors.errorLight,
      textColor: colors.errorDark,
    },
    checking: {
      label: 'Checking…',
      dotColor: colors.warning,
      bgColor: colors.warningLight,
      textColor: colors.warningDark,
    },
  }[status];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: status === 'offline' ? colors.error : colors.border,
        },
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            VaaniSetu Connection
          </Text>
          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            {status === 'online'
              ? `Connected to ${serverHost}`
              : status === 'offline'
              ? 'Backend server is unreachable'
              : 'Verifying server reachability…'}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            {backgroundColor: statusBadgeConfig.bgColor},
          ]}>
          <View
            style={[
              styles.dot,
              {backgroundColor: statusBadgeConfig.dotColor},
            ]}
          />
          <Text
            style={[
              styles.badgeText,
              {color: statusBadgeConfig.textColor},
            ]}>
            {statusBadgeConfig.label}
          </Text>
        </View>
      </View>

      {status === 'offline' && (
        <View style={[styles.offlineActionSection, {borderTopColor: colors.borderLight}]}>
          <Text style={[styles.offlineNotice, {color: colors.textSecondary}]}>
            Unable to reach the VaaniSetu server at{' '}
            <Text style={[styles.boldHost, {color: colors.textPrimary}]}>
              {serverHost}
            </Text>
            . Ensure the backend is running and phone is on the same network.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.retryBtn,
                {backgroundColor: colors.primary},
                isRetrying && styles.btnDisabled,
              ]}
              onPress={onRetry}
              disabled={isRetrying}>
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.retryBtnText}>🔄 Retry Connection</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.detailsToggleBtn}
              onPress={() => setShowDetails(!showDetails)}>
              <Text style={[styles.detailsToggleText, {color: colors.textMuted}]}>
                {showDetails ? 'Hide Details' : 'View Details'}
              </Text>
            </Pressable>
          </View>

          {showDetails && statusDetail ? (
            <View
              style={[
                styles.detailsBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}>
              <Text style={[styles.detailsTitle, {color: colors.textSecondary}]}>
                Diagnostic Details:
              </Text>
              <Text style={[styles.detailsContent, {color: colors.error}]}>
                {statusDetail}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {status === 'online' && statusDetail ? (
        <View style={[styles.onlineInfoRow, {borderTopColor: colors.borderLight}]}>
          <Text style={[styles.onlineServiceText, {color: colors.textMuted}]}>
            Service:{' '}
            <Text style={[styles.serviceName, {color: colors.successDark}]}>
              {statusDetail}
            </Text>
          </Text>
        </View>
      ) : null}
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
    gap: spacing.sm,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  offlineActionSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  offlineNotice: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  boldHost: {
    fontWeight: typography.fontWeights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    ...shadows.button,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  detailsToggleBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  detailsToggleText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    textDecorationLine: 'underline',
  },
  detailsBox: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  detailsContent: {
    fontSize: typography.fontSizes.xs,
    fontFamily: Platform?.OS === 'ios' ? 'Courier' : 'monospace',
  },
  onlineInfoRow: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  onlineServiceText: {
    fontSize: typography.fontSizes.xs,
  },
  serviceName: {
    fontWeight: typography.fontWeights.semiBold,
  },
});
