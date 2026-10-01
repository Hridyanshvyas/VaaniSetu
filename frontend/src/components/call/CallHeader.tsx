import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
} from '../../theme/theme';

type Props = {
  callId: string;
  userId: string;
  language: string;
  isReadyToSpeak: boolean;
  onEndCall: () => void;
};

export function CallHeader({
  callId,
  userId,
  language,
  isReadyToSpeak,
  onEndCall,
}: Props) {
  const {colors, isDark, toggleTheme} = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.leftInfo}>
        <View
          style={[
            styles.statusDot,
            {backgroundColor: isReadyToSpeak ? colors.success : colors.warning},
          ]}
        />
        <View style={styles.textGroup}>
          <View style={styles.roomRow}>
            <Text style={[styles.roomLabel, {color: colors.slateLight}]}>ROOM</Text>
            <Text style={[styles.roomId, {color: colors.textPrimary}]}>{callId}</Text>
          </View>
          <Text style={[styles.userInfo, {color: colors.textMuted}]}>
            {userId} ·{' '}
            <Text style={[styles.langTag, {color: colors.primary}]}>
              {language.toUpperCase()}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <Pressable
          style={[styles.themeBtn, {backgroundColor: colors.surfaceSubtle, borderColor: colors.border}]}
          onPress={toggleTheme}
          accessibilityLabel="Toggle Theme">
          <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </Pressable>

        <Pressable
          style={[styles.endBtn, {backgroundColor: colors.errorLight, borderColor: colors.error}]}
          onPress={onEndCall}>
          <Text style={[styles.endBtnText, {color: colors.errorDark}]}>End Call</Text>
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
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textGroup: {
    gap: 1,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  roomId: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  userInfo: {
    fontSize: 11,
  },
  langTag: {
    fontWeight: typography.fontWeights.bold,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 13,
  },
  endBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  endBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
});
