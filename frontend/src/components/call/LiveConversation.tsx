import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '../../theme/theme';

export type DialogueMessage = {
  id: string;
  timestamp: string;
  originalText?: string;
  translatedText?: string;
  language: string;
  bitsUsed: number;
  confidence: number;
  lost: boolean;
};

type Props = {
  messages: DialogueMessage[];
  isReadyToSpeak: boolean;
};

export function LiveConversation({messages, isReadyToSpeak}: Props) {
  const {colors, isDark} = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {/* Header */}
      <View style={[styles.headerRow, {borderBottomColor: colors.borderLight}]}>
        <Text style={[styles.headerTitle, {color: colors.textPrimary}]}>
          Live Conversation
        </Text>
        <Text style={[styles.countBadge, {color: colors.slateLight}]}>
          {messages.length} {messages.length === 1 ? 'exchange' : 'exchanges'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, {color: colors.textPrimary}]}>
              {isReadyToSpeak ? 'Ready for Conversation' : 'Connecting to Partner'}
            </Text>
            <Text style={[styles.emptySubtitle, {color: colors.textMuted}]}>
              {isReadyToSpeak
                ? 'Hold the Push-to-Talk button below to speak. Real-time dialogue and translated speech will appear here.'
                : 'Waiting for partner or server connection…'}
            </Text>
          </View>
        ) : (
          messages.map(item => (
            <View
              key={item.id}
              style={[
                styles.messageCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
                  borderColor: colors.borderLight,
                },
                item.lost && {
                  borderColor: colors.error,
                  backgroundColor: colors.errorLight,
                },
              ]}>
              <View style={styles.bubbleMeta}>
                <Text style={[styles.metaTime, {color: colors.slateLight}]}>
                  {item.timestamp}
                </Text>
                <View style={[styles.metaPill, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.metaPillText, {color: colors.primary}]}>
                    {item.bitsUsed} bits · {item.language.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Spoken original */}
              {item.originalText ? (
                <View style={styles.bubbleRow}>
                  <Text style={styles.roleIcon}>🗣️</Text>
                  <View style={styles.speechCol}>
                    <Text style={[styles.roleLabel, {color: colors.primary}]}>You</Text>
                    <Text style={[styles.speechText, {color: colors.textPrimary}]}>
                      "{item.originalText}"
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Translated Voice output */}
              {item.translatedText && (
                <View
                  style={[
                    styles.translatedBubble,
                    {
                      backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}>
                  <Text style={styles.roleIcon}>🔊</Text>
                  <View style={styles.speechCol}>
                    <Text style={[styles.roleLabel, {color: colors.successDark}]}>
                      Partner Hears
                    </Text>
                    <Text style={[styles.translatedSpeechText, {color: colors.textPrimary}]}>
                      "{item.translatedText}"
                    </Text>
                  </View>
                </View>
              )}

              {item.lost && (
                <View style={[styles.lostBanner, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.lostText, {color: colors.errorDark}]}>
                    ⚠ Error-correction limit exceeded (packet dropped on weak link)
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.xs,
    textAlign: 'center',
    lineHeight: typography.lineHeights.xs,
  },
  messageCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  bubbleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaTime: {
    fontSize: 10,
  },
  metaPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: borderRadius.xs,
  },
  metaPillText: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.bold,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  roleIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  speechCol: {
    flex: 1,
    gap: 1,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  speechText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    lineHeight: typography.lineHeights.sm,
  },
  translatedBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: 2,
  },
  translatedSpeechText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    lineHeight: typography.lineHeights.sm,
    fontStyle: 'italic',
  },
  lostBanner: {
    padding: 6,
    borderRadius: borderRadius.xs,
    marginTop: 2,
  },
  lostText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semiBold,
  },
});
