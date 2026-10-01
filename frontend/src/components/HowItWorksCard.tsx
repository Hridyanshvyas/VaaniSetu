import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

export function HowItWorksCard() {
  const {colors, isDark} = useTheme();
  const [expanded, setExpanded] = useState(false);

  const steps = [
    {
      num: '1',
      title: 'Speak Naturally',
      desc: 'Sender speaks into the phone microphone in their native Indian language.',
    },
    {
      num: '2',
      title: 'AI Speech Recognition (STT)',
      desc: 'AI4Bharat IndicConformer / Whisper converts spoken audio to text.',
    },
    {
      num: '3',
      title: 'Neural Translation (NMT)',
      desc: 'IndicTrans2 translates text into the receiver\'s native language.',
    },
    {
      num: '4',
      title: 'Compression & FEC Encoding',
      desc: 'Text is packed into custom 6-bit bitstream with Reed-Solomon (255, 223) FEC.',
    },
    {
      num: '5',
      title: 'Ultra-Low Bitrate Transfer',
      desc: 'Lightweight packets traverse constrained radio/mesh/network channels.',
    },
    {
      num: '6',
      title: 'Voice Synthesis & Playback (TTS)',
      desc: 'Indic-TTS synthesizes natural spoken audio. The receiver only ever hears a voice.',
    },
  ];

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
          <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
            How VaaniSetu Works
          </Text>
        </View>
        <Text style={[styles.chevron, {color: colors.slateLight}]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.stepsContainer, {borderTopColor: colors.borderLight}]}>
          {steps.map(step => (
            <View key={step.num} style={styles.stepRow}>
              <View
                style={[
                  styles.numBadge,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : colors.primaryLight,
                    borderColor: colors.primaryBorder,
                  },
                ]}>
                <Text style={[styles.numText, {color: colors.primary}]}>
                  {step.num}
                </Text>
              </View>

              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, {color: colors.textPrimary}]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDesc, {color: colors.textMuted}]}>
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
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
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  chevron: {
    fontSize: 12,
    paddingHorizontal: spacing.xs,
  },
  stepsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  numBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  numText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
