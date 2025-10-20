
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

// Placeholder data - replace with your actual data later
const PLACEHOLDER_ITEMS = [
  { id: '1', title: 'Item 1', description: 'Description for item 1' },
  { id: '2', title: 'Item 2', description: 'Description for item 2' },
  { id: '3', title: 'Item 3', description: 'Description for item 3' },
  { id: '4', title: 'Item 4', description: 'Description for item 4' },
  { id: '5', title: 'Item 5', description: 'Description for item 5' },
];

export default function HomeScreen() {
  const { logout } = useAuth();

  const handleAddItem = () => {
    // Navigate to add/create page
    // router.push('/add-item');
    console.log('Add item pressed');
  };

  const handleItemPress = (itemId: string) => {
    // Navigate to item detail page
    // router.push(`/item/${itemId}`);
    console.log('Item pressed:', itemId);
  };

  const renderItem = ({ item }: { item: typeof PLACEHOLDER_ITEMS[0] }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <ThemedText type="defaultSemiBold" style={styles.itemTitle}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Items</ThemedText>
      </ThemedView>

      <ThemedView style={styles.actionContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <IconSymbol name="plus" size={20} color="white" />
          <ThemedText style={styles.addButtonText}>Add New Item</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.listContainer}>
        <FlatList
          data={PLACEHOLDER_ITEMS}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    marginTop: 20,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  actionContainer: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    marginBottom: 20,
  },
  listContent: {
    gap: 0,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 12,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
