import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { THEME } from '../theme/theme';

export default function ScreenContainer({
  children,
  scrollable = true,
  keyboardOffset = Platform.OS === 'ios' ? 64 : 0,
  contentContainerStyle,
  style,
}) {
  const innerContent = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.staticContent, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardOffset}
    >
      {innerContent}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl * 1.5,
  },
  staticContent: {
    padding: THEME.spacing.lg,
  },
});