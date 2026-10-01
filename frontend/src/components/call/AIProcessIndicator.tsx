import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '../../theme/theme';

type Props = {
  status: string;
  recording: boolean;
  processing: boolean;
  playing: boolean;
};

export function AIProcessIndicator({
  status,
  recording,
  processing,
  playing,
}: Props) {
  const {colors} = useTheme();

  type StageKey = 'listening' | 'recognizing' | 'translating' | 'optimizing' | 'sending' | 'speaking' | 'idle';

  let currentStage: StageKey = 'idle';
  if (recording) currentStage = 'listening';
  else if (processing) currentStage = 'optimizing';
  else if (playing) currentStage = 'speaking';

  const stages: {key: StageKey; label: string}[] = [
    {key: 'listening', label: 'Listen'},
    {key: 'recognizing', label: 'STT'},
    {key: 'translating', label: 'NMT'},
    {key: 'optimizing', label: 'FEC'},
    {key: 'sending', label: 'Send'},
    {key: 'speaking', label: 'TTS'},
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {/* 6-Stage Progress Track */}
      <View style={styles.trackRow}>
        {stages.map((stage, idx) => {
          const isActive = currentStage === stage.key;
          const isPassed =
            (currentStage === 'optimizing' && idx <= 3) ||
            (currentStage === 'speaking' && idx <= 5);

          const dotBg = isActive
            ? (stage.key === 'listening'
                ? colors.recordingRed
                : stage.key === 'speaking'
                ? colors.playingGreen
                : colors.primary)
            : isPassed
            ? colors.primaryLight
            : colors.surfaceSubtle;

          const textColor = isActive
            ? (stage.key === 'listening'
                ? colors.recordingRed
                : stage.key === 'speaking'
                ? colors.playingGreen
                : colors.primary)
            : colors.textMuted;

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stageNode}>
                <View
                  style={[
                    styles.nodeDot,
                    {
                      backgroundColor: dotBg,
                      borderColor: isActive ? colors.primary : colors.borderLight,
                    },
                    isActive && styles.nodeDotActive,
                  ]}>
                  {isActive && <View style={styles.innerGlow} />}
                </View>
                <Text
                  style={[
                    styles.stageLabel,
                    {color: textColor},
                    isActive && styles.stageLabelActive,
                  ]}>
                  {stage.label}
                </Text>
              </View>

              {idx < stages.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: isPassed ? colors.primary : colors.borderLight,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Real-time Status String */}
      <Text style={[styles.statusText, {color: colors.textMuted}]} numberOfLines={1}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    gap: 4,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  stageNode: {
    alignItems: 'center',
    gap: 2,
  },
  nodeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeDotActive: {
    transform: [{scale: 1.2}],
  },
  innerGlow: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeights.medium,
  },
  stageLabelActive: {
    fontWeight: typography.fontWeights.bold,
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
    marginBottom: 10,
    borderRadius: 1,
  },
  statusText: {
    fontSize: 10.5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
