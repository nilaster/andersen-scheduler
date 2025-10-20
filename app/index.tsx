
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { getSchedules } from '@/lib/db';
import { Schedule, ScheduleType } from '@/types/schedule';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { userId } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedules = useCallback(async () => {
    if (userId === null) return;
    
    setIsLoading(true);
    try {
      const data = await getSchedules(userId);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Reload schedules when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules])
  );

  const handleAddItem = () => {
    router.push('/add-schedule');
  };

  const handleItemPress = (scheduleId: string) => {
    // Navigate to schedule detail/edit page
    router.push(`/${scheduleId}`);
    console.log('Schedule pressed:', scheduleId);
  };

  const getScheduleTypeLabel = (type: ScheduleType): string => {
    switch (type) {
      case ScheduleType.TIME:
        return 'Time-based';
      case ScheduleType.CHARGE_LEVEL:
        return 'Charge Level';
      case ScheduleType.MILEAGE:
        return 'Mileage-based';
      default:
        return 'Unknown';
    }
  };

  const getScheduleDetails = (schedule: Schedule): string => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysText = schedule.days.map(d => dayLabels[d]).join(', ');

    switch (schedule.type) {
      case ScheduleType.TIME:
        return `${daysText} • ${schedule.start_time} - ${schedule.end_time}`;
      case ScheduleType.CHARGE_LEVEL:
        return `${daysText} • ${schedule.desired_charge_level}% by ${schedule.ready_by}`;
      case ScheduleType.MILEAGE:
        return `${daysText} • ${schedule.desired_mileage} mi by ${schedule.ready_by}`;
      default:
        return daysText;
    }
  };

  const renderItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item.id.toString())}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <ThemedText type="defaultSemiBold" style={styles.itemTitle}>
          {item.description}
        </ThemedText>
        <ThemedText style={styles.itemType}>
          {getScheduleTypeLabel(item.type)}
        </ThemedText>
        <ThemedText style={styles.itemDescription}>
          {getScheduleDetails(item)}
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <ThemedView style={styles.emptyContainer}>
      <IconSymbol name="calendar" size={64} color="#ccc" />
      <ThemedText style={styles.emptyTitle}>No Schedules Yet</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Create your first charging schedule to get started
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView>

        <ThemedView style={styles.actionContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <IconSymbol name="plus" size={20} color="white" />
            <ThemedText style={styles.addButtonText}>Add New Schedule</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Loading schedules...</ThemedText>
            </View>
          ) : (
            <FlatList
              data={schedules}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={renderEmptyList}
            />
          )}
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },
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
  itemType: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
