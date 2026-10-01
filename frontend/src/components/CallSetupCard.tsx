import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius, shadows} from '../theme/theme';

type Props = {
  isSoloMode: boolean;
  onToggleSoloMode: (isSolo: boolean) => void;
  userId: string;
  onChangeUserId: (text: string) => void;
  callId: string;
  onChangeCallId: (text: string) => void;
};

export function CallSetupCard({
  isSoloMode,
  onToggleSoloMode,
  userId,
  onChangeUserId,
  callId,
  onChangeCallId,
}: Props) {
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
      <View style={styles.headerGroup}>
        <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
          Start a VaaniSetu Call
        </Text>
        <Text style={[styles.cardSub, {color: colors.textMuted}]}>
          Connect two devices and communicate seamlessly across Indian languages.
        </Text>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeSection}>
        <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
          Call Mode:
        </Text>
        <View style={styles.modeGrid}>
          {/* Mode 1: Voice Bridge */}
          <Pressable
            style={[
              styles.modeCard,
              {
                backgroundColor: !isSoloMode ? colors.primaryLight : colors.surfaceSubtle,
                borderColor: !isSoloMode ? colors.primary : colors.border,
              },
              !isSoloMode && styles.modeCardSelected,
            ]}
            onPress={() => onToggleSoloMode(false)}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeIcon}>👥</Text>
              {!isSoloMode && (
                <View style={[styles.activeCheck, {backgroundColor: colors.primary}]}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.modeTitle,
                {color: !isSoloMode ? (isDark ? colors.primary : colors.textPrimary) : colors.textPrimary},
              ]}>
              Voice Bridge
            </Text>
            <Text style={[styles.modeDesc, {color: colors.textMuted}]}>
              Two-device translated conversation
            </Text>
          </Pressable>

          {/* Mode 2: Solo Echo Demo */}
          <Pressable
            style={[
              styles.modeCard,
              {
                backgroundColor: isSoloMode ? colors.primaryLight : colors.surfaceSubtle,
                borderColor: isSoloMode ? colors.primary : colors.border,
              },
              isSoloMode && styles.modeCardSelected,
            ]}
            onPress={() => onToggleSoloMode(true)}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeIcon}>🔄</Text>
              {isSoloMode && (
                <View style={[styles.activeCheck, {backgroundColor: colors.primary}]}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.modeTitle,
                {color: isSoloMode ? (isDark ? colors.primary : colors.textPrimary) : colors.textPrimary},
              ]}>
              Echo Demo
            </Text>
            <Text style={[styles.modeDesc, {color: colors.textMuted}]}>
              Test speech & audio locally
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Device & Room Inputs */}
      <View style={styles.inputsSection}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
            Your Device
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.borderDark,
                color: colors.textPrimary,
              },
            ]}
            value={userId}
            onChangeText={onChangeUserId}
            placeholder="e.g. phone-180 or Alice"
            placeholderTextColor={colors.slateLight}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.inputHint, {color: colors.slateLight}]}>
            Choose a name that identifies this device.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
            Call Room ID
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.borderDark,
                color: colors.textPrimary,
              },
            ]}
            value={callId}
            onChangeText={onChangeCallId}
            placeholder="e.g. demo-call"
            placeholderTextColor={colors.slateLight}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.inputHint, {color: colors.slateLight}]}>
            Both devices must use the same room ID.
          </Text>
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
    gap: spacing.lg,
  },
  headerGroup: {
    gap: 3,
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  cardSub: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  modeSection: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  modeCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: 2,
  },
  modeCardSelected: {
    ...shadows.cardSelected,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeIcon: {
    fontSize: 18,
  },
  activeCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  modeTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  modeDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  inputsSection: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.fontSizes.base,
  },
  inputHint: {
    fontSize: 11,
  },
});
