import { declOfNum } from '../../utils/common';

export const enum CalendarDayStyle {
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
              public style: CalendarDayStyle = CalendarDayStyle.None,
              public active: boolean = false,
              public holiday: boolean = false,
              public weekend: boolean = false,
              public disabled: boolean = false,
              public highlighted: boolean = false) {}

  public classes(): string[] {    
    const classes = [];
    if (this.weekend || this.holiday) {
      classes.push('day--holiday');
    }
    classes.push(this.styleToClass.get(this.style) || '');
    if (this.disabled) {
      classes.push('day--disabled');
    }
    if (this.highlighted) {
      classes.push('day--highlighted');
    }
    return classes;
  }

  private readonly styleToClass = new Map<CalendarDayStyle, string>([
    [ CalendarDayStyle.Planned, 'day--planned' ],
    [ CalendarDayStyle.ScheduleUsed, 'day--schedule_used' ],
    [ CalendarDayStyle.OffScheduleUsed, 'day--off_schedule_used' ],
    [ CalendarDayStyle.Recall, 'day--recall' ],
    [ CalendarDayStyle.Holiday, 'day--active_holiday' ],
    [ CalendarDayStyle.None, '' ],
  ]);
}

export class LegendItem {
  constructor(public readonly text: string, 
              public readonly style: string) {}
}

export class CalendarMonth {
  public static readonly daysInWeek: number = 7;

  constructor(public readonly name: string, 
              public readonly days: CalendarDay[], 
              public readonly weeks: number,
              private readonly emptyDays: number) {}

  public getDay(date: number): CalendarDay {
    return this.days[this.emptyDays + date];
  }

  public get activeDays(): number {
    return this.days.reduce<number>((total, item) => {
      if (item.active && !item.holiday && 
          item.style !== CalendarDayStyle.Recall) {
        return ++total;
      }
      return total;
    }, 0);
  }

  public get formatActiveDays(): string {
    return `${this.activeDays} ${declOfNum(this.activeDays, ['день', 'дня', 'дней'])}`;
  }  

  public getWeekRow(week: number): CalendarDay[] {
    return this.days.slice(
      (week - 1) * CalendarMonth.daysInWeek, 
      week * CalendarMonth.daysInWeek
    );
  }
}