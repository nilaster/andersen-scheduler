
import { ScheduleForm } from '@/components/schedule-form';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function EditScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheduleId = id ? parseInt(id, 10) : undefined;

  return <ScheduleForm scheduleId={scheduleId} />;
}