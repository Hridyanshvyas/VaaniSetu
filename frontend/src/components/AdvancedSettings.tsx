import React, {useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SERVER_PRESETS} from '../config';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

type Props = {
  serverHost: string;
  onSelectPreset: (host: string) => void;
  onChangeHost: (host: string) => void;
  onTestPing: (host: string) => void;
  isPinging: boolean;
};

export function AdvancedSettings({
  serverHost,
  onSelectPreset,
  onChangeHost,
  onTestPing,
  isPinging,
}: Props) {
  const {colors, isDark} = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <Pressable
        style={styles.headerPressable}
        onPress={() => setExpanded(!expanded)}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>⚙️</Text>
          <View style={styles.titleCol}>
            <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
              Advanced Connection & Settings
            </Text>
            <Text style={[styles.cardSub, {color: colors.textMuted}]}>
              {expanded
                ? 'Server IP, presets & direct latency diagnostics'
                : `Target: ${serverHost} · Tap to configure`}
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, {color: colors.slateLight}]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.contentSection, {borderTopColor: colors.borderLight}]}>
          {/* Quick Presets */}
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            Network Presets:
          </Text>
          <View style={styles.presetsGrid}>
            {SERVER_PRESETS.map(preset => {
              const active = serverHost === preset.host;
              return (
                <Pressable
                  key={preset.label}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: active ? colors.primaryLight : colors.surfaceSubtle,
                      borderColor: active ? colors.primary : colors.border,
                    },
                    active && styles.presetBtnActive,
                  ]}
                  onPress={() => onSelectPreset(preset.host)}>
                  <Text
                    style={[
                      styles.presetBtnText,
                      {color: active ? (isDark ? colors.primary : colors.primaryDark) : colors.textPrimary},
                    ]}>
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.presetDesc,
                      {color: active ? colors.primary : colors.textMuted},
                    ]}>
                    {preset.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Host Input & Ping Button */}
          <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
            Custom Backend Host (IP:Port):
          </Text>
          <View style={styles.hostRow}>
            <TextInput
              style={[
                styles.hostInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderDark,
                  color: colors.textPrimary,
                },
              ]}
              value={serverHost}
              onChangeText={onChangeHost}
              placeholder="e.g. 192.168.1.50:8000"
              placeholderTextColor={colors.slateLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={[
                styles.pingBtn,
                {backgroundColor: isDark ? colors.primary : colors.navySecondary},
                isPinging && styles.btnDisabled,
              ]}
              onPress={() => onTestPing(serverHost)}
              disabled={isPinging}>
              {isPinging ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.pingBtnText}>Test Ping</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    ...shadows.card,
  },
  headerPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  icon: {
    fontSize: 20,
  },
  titleCol: {
    gap: 2,
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  cardSub: {
    fontSize: typography.fontSizes.xs,
  },
  chevron: {
    fontSize: 12,
    paddingHorizontal: spacing.xs,
  },
  contentSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    marginTop: 2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  presetBtn: {
    width: '48%',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: 2,
  },
  presetBtnActive: {
    ...shadows.cardSelected,
  },
  presetBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  presetDesc: {
    fontSize: 10,
  },
  hostRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  hostInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: typography.fontSizes.sm,
  },
  pingBtn: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    minHeight: 38,
    ...shadows.button,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pingBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
});
