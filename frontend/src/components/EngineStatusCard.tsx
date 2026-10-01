import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  useTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../theme/theme';

export function EngineStatusCard() {
  const {colors} = useTheme();
  const [expanded, setExpanded] = useState(false);

  const subsystems = [
    {
      name: 'Speech Recognition (STT)',
      model: 'AI4Bharat IndicConformer / Whisper',
      status: 'Ready',
      color: colors.success,
    },
    {
      name: 'Neural Translation (NMT)',
      model: 'IndicTrans2 / NLLB-200',
      status: 'Ready',
      color: colors.success,
    },
    {
      name: 'Voice Synthesis (TTS)',
      model: 'AI4Bharat Indic-TTS / VITS',
      status: 'Ready',
      color: colors.success,
    },
    {
      name: 'Text Compression',
      model: 'Custom 6-bit Bitstream + zlib',
      status: 'Active',
      color: colors.info,
    },
    {
      name: 'Error Correction (FEC)',
      model: 'Reed-Solomon (255, 223)',
      status: 'Active',
      color: colors.info,
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
          <Text style={styles.icon}>🧠</Text>
          <View style={styles.titleCol}>
            <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
              VaaniSetu AI Engine
            </Text>
            <Text style={[styles.cardSub, {color: colors.textMuted}]}>
              {expanded ? 'Tap to collapse subsystem details' : '5 core AI & channel subsystems ready'}
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, {color: colors.slateLight}]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.subsystemList, {borderTopColor: colors.borderLight}]}>
          {subsystems.map(sub => (
            <View key={sub.name} style={styles.subsystemRow}>
              <View style={styles.subsystemInfo}>
                <Text style={[styles.subsystemName, {color: colors.textPrimary}]}>
                  {sub.name}
                </Text>
                <Text style={[styles.subsystemModel, {color: colors.textMuted}]}>
                  {sub.model}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, {backgroundColor: sub.color}]} />
                <Text style={[styles.statusText, {color: sub.color}]}>
                  {sub.status}
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
  subsystemList: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  subsystemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subsystemInfo: {
    flex: 1,
    gap: 1,
  },
  subsystemName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  subsystemModel: {
    fontSize: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
  },
});
