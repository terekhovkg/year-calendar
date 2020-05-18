import Vue from 'vue';
import moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { CalendarMonth, CalendarDay, CalendarDayType } from './models';
import { Holiday, HolidayType } from '../../models/vacation';

@Component
export class YearCalendarMixins extends Vue {
  @Prop({ required: true }) readonly year!: number;
  @Prop({ default: () => [] }) readonly holidays!: Holiday[];

  private readonly monthsInYear: number = 12;
  private readonly monthsTitles: string[] = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  private readonly typeToClass = new Map<CalendarDayType, string>([
    [ CalendarDayType.Planned, 'day--planned' ],
    [ CalendarDayType.ScheduleUsed, 'day--schedule_used' ],
    [ CalendarDayType.OffScheduleUsed, 'day--off_schedule_used' ],
    [ CalendarDayType.Recall, 'day--recall' ],
    [ CalendarDayType.Holiday, 'day--active_holiday' ],
    [ CalendarDayType.None, '' ],
  ]);

  protected readonly dateFormat: string = 'DD-MM-YYYY';
  protected months: CalendarMonth[] = [];

  protected initCalendar(): void {
    if (!this.year) {
      return;
    }
    this.months = [];
    const date = moment().year(this.year);
    for (let i = 0; i < this.monthsInYear; ++i) {
      date.month(i);
      const firstDay = date.startOf('month').isoWeekday() - 1;      
      const lastDate = date.endOf('month').date()
      const weeks = Math.ceil((lastDate + firstDay) / 7);
      const days: CalendarDay[] = [];
      for (let j = 0; j < firstDay; ++j) {
        days.push(new CalendarDay(0, new Date()));        
      }
      for (let k = 1; k <= lastDate; ++k) {
        days.push(new CalendarDay(k, new Date(this.year, i, k, 23, 59, 59, 999)));
      }
      this.months.push(new CalendarMonth(this.monthsTitles[i], days, weeks, firstDay));
    }    
  }  

  protected setHolidays(): void {
    for (const holiday of this.holidays) {      
      const date = moment(holiday.date, this.dateFormat);
      if (date.year() !== this.year) {
        continue;
      }
      const day = this.getCalendarDay(date);
      if (holiday.type === HolidayType.holiday) {
        day.holiday = true;
        day.weekend = false;
      } else {
        day.weekend = true;
        day.holiday = false;
      }
    }
  }

  protected resetHolidays(): void {
    for (const month of this.months) {
      for (const day of month.days) {
        day.holiday = day.weekend = false;
      }
    }
  }

  protected isDayActive(day: CalendarDay): boolean {
    if (day.type != CalendarDayType.None) {
      return true;
    }
    return false;
  }

  protected dayClasses(day: CalendarDay): object {
    const typeClass = this.typeToClass.get(day.type);
    const classes = {
      'day--holiday': day.weekend || day.holiday,
      'day--disabled': day.disabled,
      'day--highlighted': day.highlighted
    };
    if (typeClass) {
      Object.defineProperty(classes, typeClass, {
        value: true,
        enumerable: true
      });
    }
    return classes;
  }

  protected getCalendarDay(date: moment.Moment): CalendarDay {
    const month = this.months[date.month()];
    return month.days[month.emptyDays + date.date() - 1];
  }

  protected calculateActiveDays(): void {
    for (const month of this.months) {
      month.activeDays = month.days.reduce<number>((total, item) => {
        if (this.isDayActive(item) && !item.holiday && 
            item.type !== CalendarDayType.Recall) {
          return ++total;
        }
        return total;
      }, 0);
    }
  }

  @Watch('holidays')
  private changeHolidays(): void {
    this.resetHolidays();
    this.setHolidays();
  }
}