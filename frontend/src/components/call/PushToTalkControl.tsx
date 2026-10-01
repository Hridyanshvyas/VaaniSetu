import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  shadows,
} from '../../theme/theme';

type Props = {
  recording: boolean;
  processing: boolean;
  playing: boolean;
  isReadyToSpeak: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
};

export function PushToTalkControl({
  recording,
  processing,
  playing,
  isReadyToSpeak,
  onPressIn,
  onPressOut,
}: Props) {
  const {colors, isDark} = useTheme();

  const getButtonConfig = () => {
    if (recording) {
      return {
        icon: '●',
        label: 'Release to Send',
        subLabel: 'Recording speech…',
        bgColor: colors.recordingRed,
      };
    }
    if (processing) {
      return {
        icon: '⚡',
        label: 'Transmitting…',
        subLabel: 'Compressing + FEC',
        bgColor: colors.primaryDark,
      };
    }
    if (playing) {
      return {
        icon: '🔊',
        label: 'Playing Voice…',
        subLabel: 'Receiver audio active',
        bgColor: colors.playingGreen,
      };
    }
    if (isReadyToSpeak) {
      return {
        icon: '🎙️',
        label: 'Hold to Speak',
        subLabel: 'Push to Talk',
        bgColor: colors.primary,
      };
    }
    return {
      icon: '⏳',
      label: 'Waiting for Partner',
      subLabel: 'Connect peer to speak',
      bgColor: colors.slateLight,
    };
  };

  const config = getButtonConfig();
  const disabled = !isReadyToSpeak || processing || playing;

  return (
    <View style={styles.container}>
      {/* Subtle Outer Ring */}
      <View
        style={[
          styles.outerRing,
          isDark ? styles.outerRingDark : styles.outerRingLight,
        ]}
      />

      {/* Pulse Ring only while recording */}
      {recording && (
        <View
          style={[
            styles.pulseRing,
            {
              borderColor: colors.recordingRed,
              backgroundColor: colors.recordingRedLight,
            },
          ]}
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={config.label}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          styles.pttButton,
          {backgroundColor: config.bgColor},
          recording && styles.pttRecording,
          disabled && !recording && !processing && !playing && styles.pttDisabled,
        ]}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={styles.label}>{config.label}</Text>
        <Text style={styles.subLabel}>{config.subLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
  },
  outerRingLight: {
    borderColor: 'rgba(0,82,204,0.12)',
    backgroundColor: 'rgba(0,82,204,0.03)',
  },
  outerRingDark: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
  },
  pttButton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.ptt,
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  pttRecording: {
    transform: [{scale: 1.05}],
  },
  pttDisabled: {
    opacity: 0.65,
  },
  icon: {
    fontSize: 26,
    marginBottom: 1,
    color: '#FFFFFF',
  },
  label: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.extraBold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9.5,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
});
