import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

type ScreenContainerProps = {
  children: React.ReactNode;
  padded?: boolean;
};

export function ScreenContainer({ children, padded = true }: ScreenContainerProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={padded ? styles.content : undefined}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
});
