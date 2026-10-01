import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';
import {SUPPORTED_LANGUAGES, type LanguageCode} from '../config';

type Props = {
  selectedLanguage: LanguageCode;
};

export function AnimatedBridgeVisual({selectedLanguage}: Props) {
  const {colors, isDark} = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

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

  const translateX = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  const dotOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      {/* Title */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            AI Voice Bridge
          </Text>
          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            Speech ➔ Recognize ➔ Translate ➔ Compress ➔ Send ➔ Synthesize
          </Text>
        </View>
        <View style={[styles.activePill, {backgroundColor: colors.primaryLight}]}>
          <Text style={[styles.activePillText, {color: colors.primary}]}>ACTIVE</Text>
        </View>
      </View>

      {/* Main Bridge Representation */}
      <View
        style={[
          styles.bridgeBox,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.background,
            borderColor: colors.borderLight,
          },
        ]}>
        {/* Source Language Node */}
        <View
          style={[
            styles.node,
            {backgroundColor: colors.surface, borderColor: colors.borderDark},
          ]}>
          <Text style={[styles.nodeRole, {color: colors.primary}]}>SPEECH IN</Text>
          <Text style={[styles.nodeScript, {color: colors.textPrimary}]}>
            {senderLang.script}
          </Text>
          <Text style={[styles.nodeLabel, {color: colors.textMuted}]}>
            {senderLang.label}
          </Text>
        </View>

        {/* Center Animated Pipeline Conduit */}
        <View style={styles.conduitSection}>
          <View style={[styles.pipelineTrack, {backgroundColor: colors.borderDark}]}>
            <Animated.View
              style={[
                styles.movingSignal,
                {
                  backgroundColor: colors.primary,
                  transform: [{translateX}],
                  opacity: dotOpacity,
                },
              ]}
            />
          </View>

          <View style={styles.stepsPill}>
            <Text style={[styles.stepItem, {color: colors.primary}]}>Recognize</Text>
            <Text style={[styles.stepDot, {color: colors.slateLight}]}>•</Text>
            <Text style={[styles.stepItem, {color: colors.primary}]}>Translate</Text>
            <Text style={[styles.stepDot, {color: colors.slateLight}]}>•</Text>
            <Text style={[styles.stepItem, {color: colors.primary}]}>FEC</Text>
          </View>
        </View>

        {/* Target Language Node */}
        <View
          style={[
            styles.node,
            {backgroundColor: colors.successLight, borderColor: colors.success},
          ]}>
          <Text style={[styles.nodeRole, {color: colors.successDark}]}>VOICE OUT</Text>
          <Text style={[styles.nodeScript, {color: colors.textPrimary}]}>
            {receiverLang.script}
          </Text>
          <Text style={[styles.nodeLabel, {color: colors.textMuted}]}>
            {receiverLang.label}
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
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  activePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.extraBold,
    letterSpacing: 0.5,
  },
  bridgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  node: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 70,
  },
  nodeRole: {
    fontSize: 8,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.4,
  },
  nodeScript: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginVertical: 1,
  },
  nodeLabel: {
    fontSize: 9.5,
  },
  conduitSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    gap: 4,
  },
  pipelineTrack: {
    width: 120,
    height: 3,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movingSignal: {
    width: 16,
    height: 3,
    borderRadius: borderRadius.pill,
  },
  stepsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepItem: {
    fontSize: 8.5,
    fontWeight: typography.fontWeights.bold,
  },
  stepDot: {
    fontSize: 8,
  },
});
