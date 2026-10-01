import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
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
  onSelectLanguage: (code: LanguageCode) => void;
};

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
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
          Available Languages
        </Text>
        <Text style={[styles.cardSub, {color: colors.textMuted}]}>
          Choose the language you want to speak in.
        </Text>
      </View>

      {/* 2-Column Grid */}
      <View style={styles.grid}>
        {SUPPORTED_LANGUAGES.map(item => {
          const isSelected = selectedLanguage === item.code;
          return (
            <Pressable
              key={item.code}
              onPress={() => onSelectLanguage(item.code)}
              style={[
                styles.langCard,
                {
                  backgroundColor: isSelected
                    ? colors.primaryLight
                    : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                isSelected && styles.langCardSelected,
              ]}>
              <View style={styles.langHeader}>
                <Text
                  style={[
                    styles.langScript,
                    {
                      color: isSelected
                        ? (isDark ? colors.primary : colors.textPrimary)
                        : colors.textPrimary,
                    },
                  ]}>
                  {item.script}
                </Text>
                {isSelected && (
                  <View style={[styles.checkBadge, {backgroundColor: colors.primary}]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.langLabel,
                  {color: isSelected ? colors.textPrimary : colors.textSecondary},
                  isSelected && styles.langLabelSelected,
                ]}>
                {item.label}
              </Text>

              <View
                style={[
                  styles.voicePill,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryBorder
                      : (isDark ? colors.border : colors.borderLight),
                  },
                ]}>
                <Text
                  style={[
                    styles.voiceText,
                    {
                      color: isSelected
                        ? (isDark ? colors.textPrimary : colors.primaryDark)
                        : colors.textMuted,
                    },
                  ]}>
                  AI Voice
                </Text>
              </View>
            </Pressable>
          );
        })}
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
    gap: spacing.md,
  },
  headerGroup: {
    gap: 2,
  },
  cardTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  cardSub: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  langCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: 3,
  },
  langCardSelected: {
    ...shadows.cardSelected,
  },
  langHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  langScript: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.lineHeights.lg,
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  langLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  langLabelSelected: {
    fontWeight: typography.fontWeights.bold,
  },
  voicePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: borderRadius.xs,
    marginTop: 3,
  },
  voiceText: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.semiBold,
  },
});
