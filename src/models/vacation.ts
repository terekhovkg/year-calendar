export const enum HolidayType {
  holiday = 'holiday',
  weekend = 'weekend'
}

export const enum VacationDateType {
  Planned,
  ScheduleUsed,
  OffScheduleUsed,
  Recall,
  Holiday
}

export interface Holiday {
  date: string;
  type: HolidayType;
}

export interface VacationDate {
  date: string;
  type: VacationDateType;
}

export interface Period {
  start: string;
  end: string;
}