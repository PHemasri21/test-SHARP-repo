import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDeviceResponsiveness } from '../hooks/useDeviceResponsiveness';
import { THEME } from '../theme/theme';

export default function ResponsiveLayoutWrapper({ children, style }) {
  const { maxContentWidth, isTablet, isLandscape } = useDeviceResponsiveness();

  return (
    <View style={[styles.outer, style]}>
      <View
        style={[
          styles.inner,
          {
            maxWidth: maxContentWidth,
            paddingHorizontal: isTablet || isLandscape ? THEME.spacing.xl : THEME.spacing.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});