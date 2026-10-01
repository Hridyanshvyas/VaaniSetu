import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {colors, typography, spacing, borderRadius, shadows} from '../theme/theme';

type ToastProps = {
  message: string | null;
  onHide: () => void;
  duration?: number;
};

export function Toast({message, onHide, duration = 2500}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onHide, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {opacity, transform: [{translateY}]},
      ]}>
      <View style={styles.toastCard}>
        <Text style={styles.toastIcon}>ℹ️</Text>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    gap: spacing.sm,
    ...shadows.cardSelected,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toastIcon: {
    fontSize: 14,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    lineHeight: typography.lineHeights.sm,
  },
});
