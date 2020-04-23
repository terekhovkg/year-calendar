<template>
  <div class="container">
    <div class="legend" v-if="showLegend">
      <div 
        v-for="(item, index) in legendItems" 
        :key="`legend-item-${index}`" 
        class="legend-item"
      >
        <div class="legend-item--mark" :class="item.style">{{ index + 1 }}</div>
        <div class="legend-item--text" v-html="item.text"></div>
      </div>
    </div>
    <div class="calendar">
      <table>
        <tbody>
          <tr v-for="(num, index) in 3" :key="index">
            <td v-for="(month, index) in getMonthRow(num)" :key="`month-${index}`">
              <div class="calendar-month">
                <div class="month-title">
                  <div class="month-spacer"></div>
                  <div class="month-name">{{ month.name }}</div>
                  <div class="days-count">{{ month.getActiveDays() }}</div>
                </div>      
                <div class="month-body">
                  <table>
                    <thead>
                      <tr>
                        <th 
                          v-for="(dayTitle, index) in daysTitles" 
                          :key="`dayTitle-${index}`"
                        >
                          {{ dayTitle }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(week, index) in month.weeks" :key="`row-${index}`">
                        <td v-for="(day, index) in month.getWeekRow(week)" :key="`day-${index}`">
                          <div
                            @click="selectDay(day)"
                            v-if="day.value !== -1"                    
                            :class="day.classes()"
                          >
                            {{ day.value }}                   
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>      
    </div>
    <div class="periods">
      <div 
        v-for="(period, index) in periods" 
        :key="`period-${index}`"
        @mouseover="highlightPeriod(period)"
        @mouseout="highlightPeriod(period)"
        class="period-item"
      >
        <div class="period-text">{{ formatPeriod(period) }}</div>
        <div v-if="!readonly" @click="deletePeriod(period, index)">
          <close-circle class="clear-btn" title=""/>
        </div>
      </div> 
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { declOfNum } from '../utils/common';
import { 
  Holiday, HolidayType, VacationDate, 
  VacationDateType, Period 
} from '../models/vacation';
import { Component, Prop, PropSync, Watch, Emit } from 'vue-property-decorator';
import CloseCircle from 'vue-material-design-icons/CloseCircle.vue';

type Moment = Moment.Moment;
const moment = extendMoment(Moment);
const daysInWeek = 7;

const enum CalendarDayStyle {
  None,
  Holiday,
  ActiveHoliday,
  Planned,
  ScheduleUsed,
  OffScheduleUsed,
  Recall
}

class LegendItem {
  public readonly text: string;
  public readonly style: string;

  constructor(text: string, 
              style: string) {
    this.text = text;
    this.style = style;
  }
}

class CalendarMonth {
  public readonly days: CalendarDay[];
  public readonly name: string;
  public readonly weeks: number;
  private emptyDays: number;

  constructor(name: string, 
              days: CalendarDay[], 
              weeks: number,
              emptyDays: number) {
    this.days = days;
    this.name = name;
    this.weeks = weeks;
    this.emptyDays = emptyDays;
  }

  public getDay(date: number): CalendarDay {
    return this.days[this.emptyDays + date];
  }

  public getActiveDays(): string {
    const count = this.days.reduce<number>((total, item) => {
      if (item.active && 
          item.style !== CalendarDayStyle.ActiveHoliday && 
          item.style !== CalendarDayStyle.Recall) {
        return ++total;
      }
      return total;
    }, 0);
    return `${count} ${declOfNum(count, ['день', 'дня', 'дней'])}`;
  }

  public clearActiveDays(): void {
    for (const day of this.days) {   
      day.active = day.highlighted = false;      
      day.style = day.holiday || day.weekend ? CalendarDayStyle.Holiday : CalendarDayStyle.None;
    }
  }

  public getWeekRow(week: number): CalendarDay[] {
    return this.days.slice((week - 1) * daysInWeek, week * daysInWeek);
  }
}

class CalendarDay {
  public active: boolean;
  public holiday: boolean;
  public weekend: boolean;
  public disabled: boolean;
  public highlighted: boolean;
  public style: CalendarDayStyle;
  public readonly date: Date; 
  public readonly value: number;

  constructor(value: number,
              date: Date, 
              style: CalendarDayStyle = CalendarDayStyle.None,
              active: boolean = false,
              holiday: boolean = false,
              weelend: boolean = false,
              disabled: boolean = false,
              highlighted: boolean = false) {
    this.active = active;
    this.holiday = holiday;
    this.weekend = weelend;
    this.disabled = disabled;
    this.highlighted = highlighted;
    this.style = style;
    this.value = value;
    this.date = date;
  }

  public setStyle(style: CalendarDayStyle): void {
    this.active = true;
    this.style = style;
  }

  public classes(): string[] {    
    const classes = [];
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
    [ CalendarDayStyle.Holiday, 'day--holiday' ],
    [ CalendarDayStyle.ActiveHoliday, 'day--active_holiday' ],
    [ CalendarDayStyle.None, '' ],
  ]);
}

@Component({
  components: {
    CloseCircle
  }
})
export default class YearCalendar extends Vue {
  @Prop({ default: false }) readonly readonly!: boolean;
  @Prop({ default: false }) readonly showLegend!: boolean;
  @Prop({ default: [] }) readonly holidays!: Holiday[];
  @Prop({ default: [] }) readonly vacationDates!: VacationDate[];
  @Prop({ required: true }) readonly year!: number;
  @Prop({ required: true }) readonly availableDays!: number;
  @PropSync('periods', { default: [] }) readonly plannedPeriods!: Period[];
  
  private readonly dateFormat: string = 'DD-MM-YYYY';
  private readonly monthsInYear: number = 12;
  private readonly monthsPerRow: number = 4;
  private readonly monthsTitles: string[] = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  private readonly daysTitles: string[] = [
    'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'
  ];
  private readonly legendItems: LegendItem[] = [
    {
      style: 'day--planned',
      text: 'Запланированный<br>отпуск'
    },
    {
      style: 'day--schedule_used',
      text: 'Использованный<br>отпуск'
    },
    {
      style: 'day--recall',
      text: 'Отзыв из отпуска'
    },
    {
      style: 'day--active_holiday',
      text: 'Нерабочие праздничные<br>дни, приходящиеся на период отпуска'
    },
    {
      style: 'day--off_schedule_used',
      text: 'Предоставленный отпуск вне ГО'
    }
  ]
  private months: CalendarMonth[] = [];
  private previousDate!: Date
  private periodSelectionStarted: boolean = false;

  private initCalendar(): void {
    if (!this.year) {
      return;
    }
    const date = moment().year(this.year);
    for (let i = 0; i < this.monthsInYear; ++i) {
      date.month(i);
      const firstDay = date.startOf('month').isoWeekday() - 1;      
      const lastDate = date.endOf('month').date()
      const weeks = Math.ceil((lastDate + firstDay) / daysInWeek);
      const days: CalendarDay[] = [];
      for (let j = 0; j < firstDay; ++j) {
        days.push(new CalendarDay(-1, new Date()));        
      }
      for (let k = 1; k <= lastDate; ++k) {
        days.push(new CalendarDay(k, new Date(this.year, i, k, 23, 59, 59, 999)));
      }
      this.months.push(new CalendarMonth(this.monthsTitles[i], days, weeks, firstDay));
    }    
  }

  private formatPeriod(period: Period): string {
    return `${moment(period.start, this.dateFormat).format('DD.MM')} - ${moment(period.end, this.dateFormat).format('DD.MM')}`;
  }

  private highlightPeriod(period: Period): void {
    const range = moment.range(
      moment(period.start, this.dateFormat),
      moment(period.end, this.dateFormat)
    );
    for (const date of range.by('days')) {
      const day = this.getCalendarDay(date)
      day.highlighted = !day.highlighted;
    }
  }

  private selectDay(day: CalendarDay): void {
    if (this.readonly || this.selectedDays === this.availableDays) {
      return;
    }
    if (day.active && !this.periodSelectionStarted) {
      return;
    }
    if (this.periodSelectionStarted) {
      let startDate = this.previousDate;
      let endDate = day.date;
      if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
      }
      this.plannedPeriods.push({
        start: moment(startDate).format(this.dateFormat),
        end: moment(endDate).format(this.dateFormat)
      });
      this.periodSelectionStarted = false;
      this.enableUnavailableDays();
    } else {
      day.active = true;
      day.style = !day.holiday ? CalendarDayStyle.Planned : CalendarDayStyle.ActiveHoliday;
      this.previousDate = day.date;
      this.periodSelectionStarted = true;
      this.disableUnavailableDays(this.previousDate, this.availableDays - this.selectedDays);
    }
  }

  private get selectedDays(): number {
    return this.plannedPeriods.reduce<number>((total, item) => {
      const start = moment(item.start, this.dateFormat);
      const end = moment(item.end, this.dateFormat);
      return total + Math.abs(start.diff(end, 'days')) + 1;
    }, 0);
  }  

  private deletePeriod(period: Period, index: number): void {
    const range = moment.range(
      moment(period.start, this.dateFormat),
      moment(period.end, this.dateFormat));
    for (const date of range.by('days')) {
      const month = this.months[date.month()];
      month.clearActiveDays();
    }
    this.plannedPeriods.splice(index, 1);
  }

  private definePeriodStart(date: Date | Moment, count: number): Moment {
    let start = moment(date, this.dateFormat).subtract(count, 'day');
    const range = moment.range(start, date);
    for (const date of range.by('days', { excludeEnd: true })) {
      const day = this.getCalendarDay(date)
      if (day.active) {
        start = date;
      }
    }
    return start;
  }

  private definePeriodEnd(date: Date | Moment, count: number): Moment {
    let end = moment(date, this.dateFormat).add(count, 'day');
    const range = moment.range(date, end);
    for (const date of range.reverseBy('days', { excludeStart: true })) {
      const day = this.getCalendarDay(date)
      if (day.active) {
        end = date;
      }
    }
    return end;
  }

  private disableUnavailableDays(date: Date | Moment, count: number): void {
    const start = this.definePeriodStart(date, count);
    const end = this.definePeriodEnd(date, count);
    const year = moment().year(this.year);
    const ranges = [
      moment.range(year.startOf('year'), start),
      moment.range(end, year.endOf('year'))
    ]
    for (const range of ranges) {
      for (const date of range.by('days')) {
        const day = this.getCalendarDay(date)
        day.disabled = true;        
      }
    }
  }

  private enableUnavailableDays(): void {
    for (const month of this.months) {
      for (const day of month.days) {      
        day.disabled = false;    
      }  
    }
  }

  private getCalendarDay(date: Moment): CalendarDay {
    return this.months[date.month()].getDay(date.date() - 1);
  }

  private getMonthRow(row: number): CalendarMonth[] {
    return this.months.slice((row - 1) * this.monthsPerRow, row * this.monthsPerRow);
  }

  private markHolidays(): void {
    for (const holiday of this.holidays) {      
      const date = moment(holiday.date, this.dateFormat);
      if (date.year() !== this.year) {
        continue;
      }
      const day = this.getCalendarDay(date);
      day.style = CalendarDayStyle.Holiday;
      if (holiday.type === HolidayType.holiday) {
        day.holiday = true;
        day.weekend = false;
      } else {
        day.weekend = true;
        day.holiday = false;
      }
    }
  }  

  private markVacationDates(): void {
    for (const vacationDate of this.vacationDates) {
      const date = moment(vacationDate.date, this.dateFormat);
      if (date.year() !== this.year) {
        continue;
      }
      const day = this.getCalendarDay(date)
      day.active = true;
      day.style = this.mapTypeToStyle(vacationDate.type);
    }
  } 

  private mapTypeToStyle(type: VacationDateType): CalendarDayStyle {
    switch (type) {
      case VacationDateType.Planned: {
        return CalendarDayStyle.Planned;
      }
      case VacationDateType.ScheduleUsed: {
        return CalendarDayStyle.ScheduleUsed;
      }
      case VacationDateType.OffScheduleUsed: {
        return CalendarDayStyle.OffScheduleUsed;
      }
      case VacationDateType.Recall: {
        return CalendarDayStyle.Recall;
      }
      case VacationDateType.Holiday: {
        return CalendarDayStyle.ActiveHoliday;
      }
      default: {
        return CalendarDayStyle.None
      }
    }
  }

  private created(): void {
    this.initCalendar();
    this.markHolidays();
    this.markVacationDates();
    this.changePeriods();
  }

  @Emit('select-period')
  selectPeriod(period: Period): Period {
    return period;
  }

  @Watch('year')
  private changeYear(): void {
    this.created();
  }

  @Watch('holidays')
  private changeHolidays(): void {
    this.markHolidays();
  }

  @Watch('vacationDates')
  private changeVacationDates(): void {
    this.markVacationDates();
  }

  @Watch('periods')
  private changePeriods(): void {
    for (const period of this.plannedPeriods) {
      const range = moment.range(
        moment(period.start, this.dateFormat),
        moment(period.end, this.dateFormat)
      );
      for (const date of range.by('days')) {
        const day = this.getCalendarDay(date);
        day.active = true;
        day.style = day.holiday ? CalendarDayStyle.ActiveHoliday : CalendarDayStyle.Planned;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$calendar-day-hover-color: rgb(220, 220, 220);
$red-color-styleguide: rgb(255, 90, 90);
$light-gray-color-styleguide: rgb(186, 186, 186);
$dark-gray-color-styleguide: rgb(67, 74, 91);
$blue-color-styleguide: rgb(0, 136, 187);

.day--holiday {
  color: $red-color-styleguide;
}

.day--off_schedule_used {
  background-color: $dark-gray-color-styleguide;
  color: #fff;

  &:hover {
    background-color: $dark-gray-color-styleguide !important;
    opacity: 0.8; 
  }
}    

.day--active_holiday {
  background-color: $red-color-styleguide;
  color: #fff;

  &:hover {
    background-color: $red-color-styleguide !important;
    opacity: 0.8;
  }
}

.day--recall {
  border: 2px solid $light-gray-color-styleguide;

  &:hover {
    opacity: 0.8;
  }
}

.day--disabled {
  opacity: 0.38;
  cursor: none;
  pointer-events: none;
}

.day--planned {
  background: $blue-color-styleguide;
  color: #fff;

  &:hover {
    background: $blue-color-styleguide !important;
    opacity: 0.8;
  }
}

.day--highlighted {
  transform: scale(1.1);
}

.day--schedule_used {
  background: $light-gray-color-styleguide;
  color: #fff;

  &:hover {
    background: $light-gray-color-styleguide !important;
    opacity: 0.8;
  }
}

.container {
  position: relative;
  font-size: 12px;
  cursor: default;
  width: 1060px;

  .legend {
    margin: 10px 0px;
    display: flex;
    align-items: center;

    .legend-item {
      margin: 0px 10px;
      display: flex;      
      align-items: center;

      .legend-item--mark {
        border-radius: 100%;
        width: 25px;
        height: 25px;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        pointer-events: none;
      }

      .legend-item--text {
        display: flex;
        align-items: center;
        justify-content: left;
        margin-left: 10px;
        line-height: 1;
        height: 25px;
      }
    }
  }

  .calendar {

    table {
      border-spacing: 5px;
    }

    .calendar-month {
      width: 260px;
      height: 270px;
      border-radius: 3px;
      text-align: center;
      border: 1px solid rgba(0, 0, 0, .12);      

      .month-title {
        padding: 0px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, .12);        
        height: 40px;
        display: flex;
        align-items: center;

        .month-spacer {          
          flex: 33.33%;
          visibility: hidden;      
        }

        .month-name {  
          font-size: 16px;
          font-weight: 500;
          flex: 33.33%;
        }

        .days-count {
          text-align: end;         
          color: $red-color-styleguide;
          flex: 33.33%;
        }
      }

      .month-body {
        padding: 0px 10px;

        table {
          border-spacing: 2px;
          width: 100%;
        }               

        th {
          padding: 8px 0px 2px 0px;
          color: rgba(0, 0, 0, 0.38);
        }

        td > div {
          align-items: center;
          display: inline-flex;
          justify-content: center;
          font-weight: 500;          
          border-radius: 100%;
          height: 30px;
          width: 30px;
          cursor: pointer;
          user-select: none;

          &:hover {
            background-color: $calendar-day-hover-color;
          }          
        }        
      }
    }
  }

  .periods {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: left;
    flex-wrap: wrap;
    
    .period-item { 
      margin: 5px; 
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: $blue-color-styleguide;
      color: #fff;
      border-radius: 20px;
      height: 32px;

      &:hover {
        opacity: 0.8;
      }      
    }

    .period-text {
      margin: 0px 5px 0px 10px;
    }

    .clear-btn {
      margin: 0px 10px 0px 5px;
      cursor: pointer;
      font-size: 18px;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>