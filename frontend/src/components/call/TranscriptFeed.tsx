import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
} from '../../theme/theme';

export type TranscriptEntry = {
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
  transcripts: TranscriptEntry[];
  isReadyToSpeak: boolean;
};

export function TranscriptFeed({transcripts, isReadyToSpeak}: Props) {
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
      <View style={[styles.headerRow, {borderBottomColor: colors.borderLight}]}>
        <Text style={[styles.headerTitle, {color: colors.textPrimary}]}>
          Live Pipeline Transcripts
        </Text>
        <Text style={[styles.countBadge, {color: colors.slateLight}]}>
          {transcripts.length} {transcripts.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {transcripts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyTitle, {color: colors.textPrimary}]}>
              {isReadyToSpeak ? 'Ready for Conversation' : 'Connecting to Call'}
            </Text>
            <Text style={[styles.emptySubtitle, {color: colors.textMuted}]}>
              {isReadyToSpeak
                ? 'Hold the Push-to-Talk button below and speak. Transcripts and translated speech will appear here.'
                : 'Waiting for connection and partner pairing…'}
            </Text>
          </View>
        ) : (
          transcripts.map(entry => (
            <View
              key={entry.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderLight,
                  borderLeftColor: colors.primary,
                },
                entry.lost && {
                  borderLeftColor: colors.error,
                  backgroundColor: colors.errorLight,
                },
              ]}>
              <View style={styles.metaRow}>
                <Text style={[styles.timestamp, {color: colors.slateLight}]}>
                  {entry.timestamp}
                </Text>
                <View style={[styles.statsPill, {backgroundColor: colors.primaryLight}]}>
                  <Text style={[styles.statsText, {color: colors.primary}]}>
                    {entry.bitsUsed} bits · {entry.language.toUpperCase()} ·{' '}
                    {Math.round(entry.confidence * 100)}% conf
                  </Text>
                </View>
              </View>

              {entry.originalText ? (
                <View style={styles.textRow}>
                  <Text style={styles.textIcon}>🗣️</Text>
                  <Text style={[styles.originalText, {color: colors.textPrimary}]}>
                    "{entry.originalText}"
                  </Text>
                </View>
              ) : null}

              {entry.translatedText &&
              entry.translatedText !== entry.originalText ? (
                <View
                  style={[
                    styles.translatedRow,
                    {
                      backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                    },
                  ]}>
                  <Text style={styles.textIcon}>🌐</Text>
                  <Text style={[styles.translatedText, {color: colors.primary}]}>
                    "{entry.translatedText}"
                  </Text>
                </View>
              ) : null}

              {entry.lost && (
                <View style={[styles.lostBanner, {backgroundColor: colors.surface}]}>
                  <Text style={[styles.lostText, {color: colors.errorDark}]}>
                    ⚠ Error-correction limit exceeded (packet dropped)
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
    gap: spacing.sm,
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
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3.5,
    borderWidth: 1,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
  },
  statsPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  statsText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  translatedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  textIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  originalText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    flex: 1,
    lineHeight: typography.lineHeights.sm,
  },
  translatedText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    flex: 1,
    fontStyle: 'italic',
    lineHeight: typography.lineHeights.sm,
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
