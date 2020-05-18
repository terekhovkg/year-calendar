export const enum CalendarDayType {
  None,
  Holiday,
  Planned,
  ScheduleUsed,
  OffScheduleUsed,
  Recall
}

export class CalendarDay {
  constructor(public readonly value: number,
              public readonly date: Date, 
              public type: CalendarDayType = CalendarDayType.None,
              public holiday: boolean = false,
              public weekend: boolean = false,
              public disabled: boolean = false,
              public highlighted: boolean = false) {}
}

export class LegendItem {
  constructor(public readonly text: string, 
              public readonly style: string) {}
}

export class CalendarMonth {  
  public activeDays: number = 0;

  constructor(public readonly name: string, 
              public readonly days: CalendarDay[], 
              public readonly weeks: number,
              public readonly emptyDays: number) {}
}