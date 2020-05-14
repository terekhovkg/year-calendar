import Vue from 'vue';
import moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { CalendarMonth, CalendarDay, CalendarDayStyle } from './models';
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
      const weeks = Math.ceil((lastDate + firstDay) / CalendarMonth.daysInWeek);
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

  protected getCalendarDay(date: moment.Moment): CalendarDay {
    return this.months[date.month()].getDay(date.date() - 1);
  }

  @Watch('holidays')
  private changeHolidays(): void {
    this.resetHolidays();
    this.setHolidays();
  }
}