export enum ScheduleType {
    TIME = "time",
    CHARGE_LEVEL = "charge_level",
    MILEAGE = "mileage",
}

export type BaseSchedule = {
    description: string;
    days: number[]; // 0 (Sunday) to 6 (Saturday)
}

export type TimeSchedule = BaseSchedule & {
    type: ScheduleType.TIME;
    start_time: string; // "HH:MM" format
    end_time: string; // "HH:MM" format
}

export type ChargeLevelSchedule = BaseSchedule & {
    type: ScheduleType.CHARGE_LEVEL;
    ready_by: string; // "HH:MM" format. I may change this to a number if needed.
    desired_charge_level: number;
}

export type MileageSchedule = BaseSchedule & {
    type: ScheduleType.MILEAGE;
    desired_mileage: number;
}

export type Schedule = TimeSchedule | ChargeLevelSchedule | MileageSchedule;