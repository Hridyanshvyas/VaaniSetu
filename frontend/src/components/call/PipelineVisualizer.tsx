import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
} from '../../theme/theme';

type Props = {
  status: string;
  recording: boolean;
  processing: boolean;
  playing: boolean;
  isReady: boolean;
  userLanguage: string;
};

export function PipelineVisualizer({
  status,
  recording,
  processing,
  playing,
  isReady,
  userLanguage,
}: Props) {
  const {colors, isDark} = useTheme();

  const getStageInfo = () => {
    if (recording) {
      return {
        stage: 'Listening',
        icon: '🎙️',
        desc: 'Recording your speech in ' + userLanguage.toUpperCase(),
        color: colors.recordingRed,
        bg: colors.recordingRedLight,
      };
    }
    if (processing) {
      return {
        stage: 'Optimizing & Transmitting',
        icon: '⚡',
        desc: 'STT ➔ NMT ➔ Text Compression + FEC',
        color: colors.warningDark,
        bg: colors.warningLight,
      };
    }
    if (playing) {
      return {
        stage: 'Synthesizing Voice',
        icon: '🔊',
        desc: 'Playing received neural speech',
        color: colors.successDark,
        bg: colors.successLight,
      };
    }
    if (isReady) {
      return {
        stage: 'Voice Bridge Active',
        icon: '●',
        desc: 'Hold button below to speak',
        color: isDark ? colors.primary : colors.primaryDark,
        bg: colors.primaryLight,
      };
    }
    return {
      stage: 'Connecting',
      icon: '⏳',
      desc: 'Waiting for partner or server',
      color: colors.slateLight,
      bg: colors.surfaceSubtle,
    };
  };

  const stage = getStageInfo();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {/* Active Stage Banner */}
      <View style={[styles.stageBanner, {backgroundColor: stage.bg}]}>
        <Text style={[styles.stageIcon, {color: stage.color}]}>{stage.icon}</Text>
        <View style={styles.stageTextCol}>
          <Text style={[styles.stageTitle, {color: stage.color}]}>
            {stage.stage}
          </Text>
          <Text style={[styles.stageDesc, {color: colors.textSecondary}]}>
            {stage.desc}
          </Text>
        </View>
      </View>

      {/* Raw Status String from socket */}
      <View style={styles.rawStatusRow}>
        <Text style={[styles.rawStatusText, {color: colors.textMuted}]} numberOfLines={1}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  stageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  stageIcon: {
    fontSize: 16,
  },
  stageTextCol: {
    flex: 1,
    gap: 1,
  },
  stageTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  stageDesc: {
    fontSize: 10,
  },
  rawStatusRow: {
    paddingHorizontal: spacing.xs,
    paddingTop: 2,
  },
  rawStatusText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
