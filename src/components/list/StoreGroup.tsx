import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type StoreGroupProps = {
  title: string;
  count: number;
  subtle?: boolean;
  children: React.ReactNode;
};

export function StoreGroup({ title, count, subtle, children }: StoreGroupProps) {
  return (
    <View style={[styles.group, subtle && styles.groupSubtle]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, subtle && styles.iconWrapSubtle]}>
          <Ionicons name="storefront-outline" size={15} color={subtle ? '#667085' : tokens.colors.primaryDark} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
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
  },
  groupSubtle: {
    paddingTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F5F3',
  },
  iconWrapSubtle: {
    backgroundColor: '#F4F6F5',
  },
  title: {
    flex: 1,
    color: '#475467',
    fontSize: 13,
    fontWeight: '700',
  },
  count: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '700',
  },
  items: {
    gap: 0,
  },
  itemsShell: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
  },
});