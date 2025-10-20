
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DaySelectorProps {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  disabled?: boolean;
}

const DAYS = [
  { label: 'S', value: 0, fullName: 'Sunday' },
  { label: 'M', value: 1, fullName: 'Monday' },
  { label: 'T', value: 2, fullName: 'Tuesday' },
  { label: 'W', value: 3, fullName: 'Wednesday' },
  { label: 'T', value: 4, fullName: 'Thursday' },
  { label: 'F', value: 5, fullName: 'Friday' },
  { label: 'S', value: 6, fullName: 'Saturday' },
];

export function DaySelector({ selectedDays, onDaysChange, disabled = false }: DaySelectorProps) {
  const toggleDay = (day: number) => {
    if (disabled) return;
    
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort();
    
    onDaysChange(newDays);
  };

  return (
    <View style={styles.container}>
      {DAYS.map((day) => (
        <TouchableOpacity
          key={day.value}
          style={[
            styles.dayButton,
            selectedDays.includes(day.value) && styles.dayButtonActive,
            disabled && styles.dayButtonDisabled,
          ]}
          onPress={() => toggleDay(day.value)}
          disabled={disabled}
          accessibilityLabel={day.fullName}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedDays.includes(day.value) }}
        >
          <Text
            style={[
              styles.dayButtonText,
              selectedDays.includes(day.value) && styles.dayButtonTextActive,
            ]}
          >
            {day.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dayButtonDisabled: {
    opacity: 0.5,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  dayButtonTextActive: {
    color: 'white',
  },
});
