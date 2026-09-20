import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({ title, onPress, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1FAF73',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1FAF73',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#EAF7F1',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    color: '#0E2B1C',
  },
  pressed: {
    opacity: 0.92,
  },
});
