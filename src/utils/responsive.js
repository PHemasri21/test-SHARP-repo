import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const BASE_WIDTH = 390; // Reference mobile width
const BASE_HEIGHT = 844; // Reference mobile height

export function getViewportMetrics() {
  const { width, height } = Dimensions.get('window');
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);

  const isSmallPhone = shortSide < 360;
  const isTablet = shortSide >= 600;
  const isLandscape = width > height;

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

  // Cap max width on wide/tablet screens so forms and cards stay readable
  const maxContentWidth = isTablet ? 640 : isLandscape ? 560 : width;

  return {
    width,
    height,
    shortSide,
    longSide,
    isSmallPhone,
    isTablet,
    isLandscape,
    statusBarHeight,
    maxContentWidth,
  };
}

// Scales spacing/dimensions proportionally while guarding against extreme tablets
export function scaleSize(size) {
  const { shortSide, isTablet } = getViewportMetrics();
  const effectiveWidth = isTablet ? Math.min(shortSide, 520) : shortSide;
  const ratio = effectiveWidth / BASE_WIDTH;
  const clampedRatio = Math.max(0.85, Math.min(ratio, 1.25));
  return Math.round(PixelRatio.roundToNearestPixel(size * clampedRatio));
}

// Scales readable font sizes cleanly across screen sizes
export function scaleFont(size) {
  const { isSmallPhone, isTablet } = getViewportMetrics();
  const scaled = scaleSize(size);
  if (isSmallPhone) return Math.max(11, scaled - 1);
  if (isTablet) return Math.min(scaled + 1, size + 3);
  return scaled;
}

// Computes multi-column grid count (e.g., for photo thumbnails or quick cards)
export function getGridColumns(desiredItemWidth = 110, gutter = 10) {
  const { width, isTablet } = getViewportMetrics();
  const containerWidth = isTablet ? Math.min(width - 48, 640) : width - 32;
  const usable = Math.max(desiredItemWidth, containerWidth - gutter);
  return Math.max(2, Math.floor((usable + gutter) / (desiredItemWidth + gutter)));
}

export function getVerticalScale(size) {
  const { height } = getViewportMetrics();
  const ratio = height / BASE_HEIGHT;
  return Math.round(PixelRatio.roundToNearestPixel(size * Math.max(0.85, Math.min(ratio, 1.2))));
}