import { StyleProp, View, ViewStyle } from 'react-native';

export function SwipeTabs({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={style}>{children}</View>;
}