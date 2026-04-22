import { Dimensions } from 'react-native';

export type FloatingMenuAnchor = {
  x: number;
  y: number;
  width?: number;
  height?: number;
};

type FloatingMenuOptions = {
  menuWidth: number;
  menuHeight: number;
  gap?: number;
  margin?: number;
};

export function getFloatingMenuStyle(anchor: FloatingMenuAnchor | null, options: FloatingMenuOptions) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const gap = options.gap ?? 8;
  const margin = options.margin ?? 12;
  const anchorWidth = anchor?.width ?? 0;
  const anchorHeight = anchor?.height ?? 0;
  const anchorX = anchor?.x ?? margin;
  const anchorY = anchor?.y ?? margin;

  const left = Math.max(margin, Math.min(anchorX + anchorWidth - options.menuWidth, screenWidth - options.menuWidth - margin));

  const spaceBelow = screenHeight - (anchorY + anchorHeight + gap) - margin;
  const spaceAbove = anchorY - gap - margin;
  const shouldOpenAbove = spaceBelow < options.menuHeight && spaceAbove > spaceBelow;

  const top = shouldOpenAbove
    ? Math.max(margin, anchorY - gap - options.menuHeight)
    : Math.min(anchorY + anchorHeight + gap, screenHeight - options.menuHeight - margin);

  return { left, top };
}