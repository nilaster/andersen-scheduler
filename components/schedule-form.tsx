
import { DaySelector } from '@/components/day-selector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { createSchedule, deleteSchedule, getScheduleById, updateSchedule } from '@/lib/db';
import { ScheduleType } from '@/types/schedule';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedButton } from './ui/themed-button';

const SCHEDULE_TYPES: { label: string; value: ScheduleType }[] = [
    { label: 'Time Based', value: ScheduleType.TIME },
    { label: 'Charge Level Based', value: ScheduleType.CHARGE_LEVEL },
    { label: 'Mileage Based', value: ScheduleType.MILEAGE },
];

interface ScheduleFormProps {
    scheduleId?: number;
}

export function ScheduleForm({ scheduleId }: ScheduleFormProps) {
    const isEditMode = scheduleId !== undefined;
    const { userId } = useAuth();

    const [isLoadingSchedule, setIsLoadingSchedule] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [description, setDescription] = useState('');
    const [type, setType] = useState<ScheduleType>(ScheduleType.TIME);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    // Time-based fields
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Charge level-based fields
    const [readyBy, setReadyBy] = useState(new Date());
    const [showReadyByPicker, setShowReadyByPicker] = useState(false);
    const [desiredChargeLevel, setDesiredChargeLevel] = useState('80');

    // Mileage-based fields
    const [mileageReadyBy, setMileageReadyBy] = useState(new Date());
    const [showMileageReadyByPicker, setShowMileageReadyByPicker] = useState(false);
    const [desiredMileage, setDesiredMileage] = useState('150');


    const parseTimeString = (timeString: string): Date => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const loadSchedule = React.useCallback(async () => {
        if (!scheduleId || !userId) return;

        setIsLoadingSchedule(true);
        try {
            const schedule = await getScheduleById(scheduleId, userId);

            if (!schedule) {
                Alert.alert('Error', 'Schedule not found', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
                return;
            }

            // Populate form fields
            setDescription(schedule.description);
            setType(schedule.type);
            setSelectedDays(schedule.days);

            switch (schedule.type) {
                case ScheduleType.TIME:
                    if (schedule.start_time) setStartTime(parseTimeString(schedule.start_time));
                    if (schedule.end_time) setEndTime(parseTimeString(schedule.end_time));
                    break;
                case ScheduleType.CHARGE_LEVEL:
                    if (schedule.ready_by) setReadyBy(parseTimeString(schedule.ready_by));
                    if (schedule.desired_charge_level !== null) {
                        setDesiredChargeLevel(schedule.desired_charge_level.toString());
                    }
                    break;
                case ScheduleType.MILEAGE:
                    if (schedule.ready_by) setMileageReadyBy(parseTimeString(schedule.ready_by));
                    if (schedule.desired_mileage !== null) {
                        setDesiredMileage(schedule.desired_mileage.toString());
                    }
                    break;
            }
        } catch (error) {
            console.error('Failed to load schedule:', error);
            Alert.alert('Error', 'Failed to load schedule');
        } finally {
            setIsLoadingSchedule(false);
        }
    }, [scheduleId, userId]);

    useEffect(() => {
        if (isEditMode) {
            loadSchedule();
        }
    }, [isEditMode, loadSchedule, scheduleId]);

    const validateForm = (): boolean => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return false;
        }
        if (selectedDays.length === 0) {
            Alert.alert('Error', 'Please select at least one day');
            return false;
        }
        if (type === ScheduleType.TIME) {
            if (startTime >= endTime) {
                Alert.alert('Error', 'End time must be after start time');
                return false;
            }
        }
        if (type === ScheduleType.CHARGE_LEVEL) {
            const chargeLevel = parseInt(desiredChargeLevel);
            if (isNaN(chargeLevel) || chargeLevel < 0 || chargeLevel > 100) {
                Alert.alert('Error', 'Charge level must be between 0 and 100');
                return false;
            }
        }
        if (type === ScheduleType.MILEAGE) {
            const mileage = parseInt(desiredMileage);
            if (isNaN(mileage) || mileage < 0 || mileage > 250) {
                Alert.alert('Error', 'Mileage must be between 0 and 250 miles');
                return false;
            }
        }
        return true;
    };

    const formatTime = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const handleStartTimeChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartTime(selectedDate);
        }
    };

    const handleEndTimeChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndTime(selectedDate);
        }
    };

    const handleReadyByChange = (event: any, selectedDate?: Date) => {
        setShowReadyByPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setReadyBy(selectedDate);
        }
    };

    const handleMileageReadyByChange = (event: any, selectedDate?: Date) => {
        setShowMileageReadyByPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setMileageReadyBy(selectedDate);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm() || !userId) return;

        setIsSaving(true);

        try {
            const scheduleData: any = {
                description: description.trim(),
                type,
                days: selectedDays,
            };

            if (type === ScheduleType.TIME) {
                scheduleData.start_time = formatTime(startTime);
                scheduleData.end_time = formatTime(endTime);
            } else if (type === ScheduleType.CHARGE_LEVEL) {
                scheduleData.ready_by = formatTime(readyBy);
                scheduleData.desired_charge_level = parseInt(desiredChargeLevel);
            } else if (type === ScheduleType.MILEAGE) {
                scheduleData.ready_by = formatTime(mileageReadyBy);
                scheduleData.desired_mileage = parseInt(desiredMileage);
            }

            let result;
            if (isEditMode && scheduleId) {
                result = await updateSchedule(scheduleId, userId, scheduleData);
            } else {
                result = await createSchedule(userId, scheduleData);
            }

            if (result.success) {
                Alert.alert(
                    'Success',
                    isEditMode ? 'Schedule updated successfully' : 'Schedule created successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', isEditMode ? 'Failed to update schedule' : 'Failed to create schedule');
            }
        } catch (error) {
            Alert.alert('Error', isEditMode ? 'Failed to update schedule' : 'Failed to create schedule');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Schedule',
            'Are you sure you want to delete this schedule? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        if (!userId || !scheduleId) return;

        setIsDeleting(true);

        try {
            await deleteSchedule(scheduleId, userId);

            Alert.alert('Success', 'Schedule deleted successfully', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to delete schedule');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoadingSchedule) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={styles.loadingText}>Loading schedule...</ThemedText>
            </ThemedView>
        );
    }

    const isDisabled = isSaving || isDeleting;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <ThemedView style={styles.formContainer}>
                    {/* Description */}
                    <View style={styles.fieldContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Description
                        </ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Morning charging schedule"
                            value={description}
                            onChangeText={setDescription}
                            editable={!isDisabled}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Days of Week */}
                    <View style={styles.fieldContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Days of Week
                        </ThemedText>
                        <DaySelector
                            selectedDays={selectedDays}
                            onDaysChange={setSelectedDays}
                            disabled={isDisabled}
                        />
                    </View>

                    {/* Schedule Type */}
                    <View style={styles.fieldContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Schedule Type
                        </ThemedText>
                        <Picker
                            selectedValue={type}
                            onValueChange={(value) => setType(value)}
                            style={styles.picker}
                            enabled={!isDisabled}
                        >
                            {SCHEDULE_TYPES.map((scheduleType) => (
                                <Picker.Item
                                    key={scheduleType.value}
                                    label={scheduleType.label}
                                    value={scheduleType.value}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* Time-Based Fields */}
                    {type === ScheduleType.TIME && (
                        <View style={styles.fieldContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Start Time
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => setShowStartPicker(true)}
                                disabled={isDisabled}
                            >
                                <ThemedText>{formatTime(startTime)}</ThemedText>
                            </TouchableOpacity>
                            {showStartPicker && (
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    display="default"
                                    onChange={handleStartTimeChange}
                                    disabled={isDisabled}
                                />
                            )}
                        </View>
                    )}

                    {type === ScheduleType.TIME && (
                        <View style={styles.fieldContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                End Time
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => setShowEndPicker(true)}
                                disabled={isDisabled}
                            >
                                <ThemedText>{formatTime(endTime)}</ThemedText>
                            </TouchableOpacity>
                            {showEndPicker && (
                                <DateTimePicker
                                    value={endTime}
                                    mode="time"
                                    display="default"
                                    onChange={handleEndTimeChange}
                                    disabled={isDisabled}
                                />
                            )}
                        </View>
                    )}

                    {/* Charge Level-Based Fields */}
                    {type === ScheduleType.CHARGE_LEVEL && (
                        <View style={styles.fieldContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Ready By Time
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => setShowReadyByPicker(true)}
                                disabled={isDisabled}
                            >
                                <ThemedText>{formatTime(readyBy)}</ThemedText>
                            </TouchableOpacity>
                            {showReadyByPicker && (
                                <DateTimePicker
                                    value={readyBy}
                                    mode="time"
                                    display="default"
                                    onChange={handleReadyByChange}
                                    disabled={isDisabled}
                                />
                            )}
                        </View>
                    )}

                    {type === ScheduleType.CHARGE_LEVEL && (
                        <View style={styles.fieldContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Desired Charge Level (%)
                            </ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 80"
                                value={desiredChargeLevel}
                                onChangeText={setDesiredChargeLevel}
                                keyboardType="numeric"
                                editable={!isDisabled}
                            />
                        </View>
                    )}

                    {/* Mileage-Based Fields */}
                    {type === ScheduleType.MILEAGE && (
                        <View style={styles.fieldContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Ready By Time
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => setShowMileageReadyByPicker(true)}
                                disabled={isDisabled}
                            >
                                <ThemedText>{formatTime(mileageReadyBy)}</ThemedText>
                            </TouchableOpacity>
                            {showMileageReadyByPicker && (
                                <DateTimePicker
                                    value={mileageReadyBy}
                                    mode="time"
                                    display="default"
                                    onChange={handleMileageReadyByChange}
                                    disabled={isDisabled}
                                />
                            )}
                        </View>
                    )}

                    {type === ScheduleType.MILEAGE && (
                        <View style={styles.fieldContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Desired Mileage (miles)
                            </ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 150"
                                value={desiredMileage}
                                onChangeText={setDesiredMileage}
                                keyboardType="numeric"
                                editable={!isDisabled}
                            />
                        </View>
                    )}

                    {/* Submit Button */}
                    <View style={styles.buttonContainer}>
                        <ThemedButton
                            style={[styles.submitButton, isDisabled && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={isDisabled}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText style={styles.submitButtonText}>
                                    {isEditMode ? 'Update Schedule' : 'Create Schedule'}
                                </ThemedText>
                            )}
                        </ThemedButton>
                    </View>

                    {/* Delete Button */}
                    {isEditMode && (
                        <View style={styles.buttonContainer}>
                            <ThemedButton
                                style={[styles.deleteButton, isDisabled && styles.disabledButton]}
                                onPress={handleDelete}
                                disabled={isDisabled}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.deleteButtonText}>Delete Schedule</ThemedText>
                                )}
                            </ThemedButton>
                        </View>
                    )}
                </ThemedView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    timeButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        alignItems: 'center',
    },
    buttonContainer: {
        marginBottom: 16,
    },
    submitButton: {
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
});
