import React, {useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SUPPORTED_LANGUAGES, type LanguageCode} from '../config';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

type Props = {
  selectedLanguage: LanguageCode;
  isSoloMode: boolean;
  onToggleSoloMode: (isSolo: boolean) => void;
  userId: string;
  onChangeUserId: (text: string) => void;
  callId: string;
  onChangeCallId: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
};

export function HeroCallSection({
  selectedLanguage,
  isSoloMode,
  onToggleSoloMode,
  userId,
  onChangeUserId,
  callId,
  onChangeCallId,
  onSubmit,
  submitting,
}: Props) {
  const {colors, isDark} = useTheme();
  const [showConfig, setShowConfig] = useState(false);

  const senderLang =
    SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) ??
    SUPPORTED_LANGUAGES[0];

  const receiverLang =
    selectedLanguage === 'hi'
      ? {code: 'ta', label: 'Tamil', script: 'தமிழ்'}
      : selectedLanguage === 'ta'
      ? {code: 'hi', label: 'Hindi', script: 'हिन्दी'}
      : selectedLanguage === 'te'
      ? {code: 'hi', label: 'Hindi', script: 'हिन्दी'}
      : {code: 'ta', label: 'Tamil', script: 'தமிழ்'};

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
          borderColor: colors.primaryBorder,
        },
      ]}>
      {/* Top Tag & Mode Pills */}
      <View style={styles.topRow}>
        <View style={[styles.heroTag, {backgroundColor: colors.primaryLight}]}>
          <Text style={[styles.heroTagText, {color: colors.primary}]}>
            {isSoloMode ? 'ECHO DEMO' : 'VOICE BRIDGE'}
          </Text>
        </View>

        <View style={styles.modeSwitch}>
          <Pressable
            style={[
              styles.modePill,
              !isSoloMode && [
                styles.modePillActive,
                {backgroundColor: colors.primary},
              ],
            ]}
            onPress={() => onToggleSoloMode(false)}>
            <Text
              style={[
                styles.modePillText,
                !isSoloMode
                  ? styles.modePillTextActive
                  : {color: colors.textMuted},
              ]}>
              2-Device
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modePill,
              isSoloMode && [
                styles.modePillActive,
                {backgroundColor: colors.primary},
              ],
            ]}
            onPress={() => onToggleSoloMode(true)}>
            <Text
              style={[
                styles.modePillText,
                isSoloMode
                  ? styles.modePillTextActive
                  : {color: colors.textMuted},
              ]}>
              Solo Echo
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Bridge Flow Display */}
      <View style={styles.bridgeHeroBox}>
        <View
          style={[
            styles.bridgeFlowRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
              borderColor: colors.border,
            },
          ]}>
          {/* Sender Box */}
          <View style={styles.langBox}>
            <Text style={[styles.boxRole, {color: colors.primary}]}>I SPEAK</Text>
            <Text style={[styles.boxScript, {color: colors.textPrimary}]}>
              {senderLang.script}
            </Text>
            <Text style={[styles.boxLabel, {color: colors.textMuted}]}>
              {senderLang.label}
            </Text>
          </View>

          {/* Center Connector */}
          <View style={styles.centerConnector}>
            <View style={[styles.centerPulseDot, {backgroundColor: colors.primary}]} />
            <Text style={[styles.centerArrow, {color: colors.primary}]}>➔</Text>
            <Text style={[styles.centerSubText, {color: colors.slateLight}]}>
              AI Translate
            </Text>
          </View>

          {/* Receiver Box */}
          <View style={styles.langBox}>
            <Text style={[styles.boxRole, {color: colors.successDark}]}>
              {isSoloMode ? 'ECHO BACK' : 'THEY HEAR'}
            </Text>
            <Text style={[styles.boxScript, {color: colors.textPrimary}]}>
              {isSoloMode ? senderLang.script : receiverLang.script}
            </Text>
            <Text style={[styles.boxLabel, {color: colors.textMuted}]}>
              {isSoloMode ? senderLang.label : receiverLang.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Action Button */}
      <Pressable
        style={[
          styles.mainCTA,
          {backgroundColor: colors.primary},
          submitting && styles.btnDisabled,
        ]}
        onPress={onSubmit}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.mainCTAText}>
            {isSoloMode ? '🚀 Start Solo Echo Demo' : '📞 Start Voice Bridge'}
          </Text>
        )}
      </Pressable>

      {/* Network Capability Note */}
      <View style={styles.networkNoteRow}>
        <Text style={[styles.networkCheck, {color: colors.successDark}]}>✓</Text>
        <Text style={[styles.networkNoteText, {color: colors.textMuted}]}>
          Works over Wi-Fi / Hotspot / Low-bandwidth radio links
        </Text>
      </View>

      {/* Room & Device Config Toggle */}
      <View style={[styles.configToggleSection, {borderTopColor: colors.borderLight}]}>
        <Pressable
          style={styles.configToggleBtn}
          onPress={() => setShowConfig(!showConfig)}>
          <Text style={[styles.configToggleText, {color: colors.textMuted}]}>
            Room: <Text style={[styles.configHighlight, {color: colors.textPrimary}]}>{callId}</Text> · Device: <Text style={[styles.configHighlight, {color: colors.textPrimary}]}>{userId}</Text> {showConfig ? '▲' : '▼'}
          </Text>
        </Pressable>

        {showConfig && (
          <View style={styles.configInputsBox}>
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
                Your Device ID:
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
                placeholder="Device Name"
                placeholderTextColor={colors.slateLight}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
                Call Room ID:
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
                placeholder="Room Name"
                placeholderTextColor={colors.slateLight}
                autoCapitalize="none"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 2,
    ...shadows.cardSelected,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: 0.6,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: borderRadius.pill,
    padding: 2,
  },
  modePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  modePillActive: {
    ...shadows.card,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semiBold,
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  bridgeHeroBox: {
    gap: spacing.xs,
  },
  bridgeFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  langBox: {
    alignItems: 'center',
    flex: 1,
  },
  boxRole: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  boxScript: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginVertical: 1,
  },
  boxLabel: {
    fontSize: 10,
  },
  centerConnector: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  centerPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  centerArrow: {
    fontSize: 14,
    fontWeight: typography.fontWeights.bold,
  },
  centerSubText: {
    fontSize: 8,
    fontWeight: typography.fontWeights.semiBold,
  },
  mainCTA: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
    minHeight: 52,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  mainCTAText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.4,
  },
  networkNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  networkCheck: {
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
  },
  networkNoteText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.medium,
  },
  configToggleSection: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  configToggleBtn: {
    alignItems: 'center',
  },
  configToggleText: {
    fontSize: 11,
  },
  configHighlight: {
    fontWeight: typography.fontWeights.bold,
  },
  configInputsBox: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  inputField: {
    gap: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semiBold,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: typography.fontSizes.xs,
  },
});
