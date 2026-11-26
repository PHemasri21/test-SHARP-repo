import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { getGridColumns, getViewportMetrics } from '../utils/responsive';

export function useDeviceResponsiveness(desiredGridItemWidth = 110) {
  const [state, setState] = useState(() => ({
    ...getViewportMetrics(),
    gridColumns: getGridColumns(desiredGridItemWidth),
  }));

  useEffect(() => {
    const onChange = () => {
      setState({
        ...getViewportMetrics(),
        gridColumns: getGridColumns(desiredGridItemWidth),
      });
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [desiredGridItemWidth]);

  return state;
}