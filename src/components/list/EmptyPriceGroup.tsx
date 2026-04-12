import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type EmptyPriceGroupProps = {
  count: number;
  children: React.ReactNode;
};

export function EmptyPriceGroup({ count, children }: EmptyPriceGroupProps) {
  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={16} color="#B54708" />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Sin precio</Text>
        </View>
        <Text style={styles.count}>{count}</Text>
      </View>
      <View style={styles.itemsShell}>
        <View style={styles.items}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF3EF',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: '#4B6353',
    fontSize: 14,
    fontWeight: '800',
  },
  count: {
    color: '#6B7E72',
    fontSize: 12,
    fontWeight: '800',
  },
  items: {
    gap: 0,
  },
  itemsShell: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FBFDFC',
    overflow: 'visible',
  },
});