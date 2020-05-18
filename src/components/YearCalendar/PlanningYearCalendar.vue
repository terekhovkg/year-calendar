<template>
  <year-calendar
    :months="months"
    :show-periods="true"
  >
    <template #day="{ item }">
      <div
        @click="selectDay(item)"
        :class="dayClasses(item)"
      >
        {{ item.value }}
      </div>
    </template>
    <template #periods>
      <div class="periods">
        <div
          v-for="(period, index) in plannedPeriods" 
          :key="`period-${index}`"
          @mouseover="highlightPeriod(period)"
          @mouseout="highlightPeriod(period)"
          :class="periodClasses"
        >
          <div class="period-text">{{ formatPeriod(period) }}</div>
          <div @click="deletePeriod(period, index)">
            <close-circle class="clear-btn" title=""/>
          </div>
        </div> 
      </div>
    </template>
  </year-calendar>
</template>

<script lang="ts">
import { Period } from '../../models/vacation';
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import YearCalendar from './YearCalendar.vue';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { CalendarDay, CalendarDayType } from './models';
import { YearCalendarMixins } from './mixins';
import CloseCircle from 'vue-material-design-icons/CloseCircle.vue';

const moment = extendMoment(Moment);
type Moment = Moment.Moment;

@Component({
  components: {
    YearCalendar,
    CloseCircle
  }
})
export default class PlanningYearCalendar extends Mixins(YearCalendarMixins) {
  @Prop() readonly workPeriodStart!: string;
  @Prop({ required: true }) readonly availableDays!: number;
  @Prop({ default: () => [] }) readonly periods!: Period[];

  private previousDay!: CalendarDay
  private periodSelectionStarted: boolean = false;
  private plannedPeriods: Period[] = [];

  private get selectedDaysNumber(): number {
    return this.months.reduce<number>((total, item) => total += item.activeDays, 0);
  }

  private get periodClasses(): object {
    return {
      'period-item': true,
      'period-item--disabled': this.periodSelectionStarted
    }
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

  private isSameHolidayDays(firstDay: CalendarDay, secondDay: CalendarDay): boolean {
    if (firstDay.date === secondDay.date && firstDay.holiday && secondDay.holiday) {
      return true;
    }
    return false;
  }

  private selectDay(day: CalendarDay): void {
    if (!this.periodSelectionStarted) {
      if (this.selectedDaysNumber === this.availableDays || this.isDayActive(day)) return;      
    } else {
      if (this.isSameHolidayDays(this.previousDay, day)) return;      
    }
    const daysCount = this.availableDays - this.selectedDaysNumber;
    if (this.periodSelectionStarted) {
      let startDate = this.previousDay.date;
      let endDate = day.date;
      if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
      }
      this.setDisabledDays(this.previousDay.date, daysCount, false);
      const period = {
        start: moment(startDate).format(this.dateFormat),
        end: moment(endDate).format(this.dateFormat)
      };
      this.setPeriod(period, true);
      this.plannedPeriods.push(period);
      this.periodSelectionStarted = false;
    } else {
      this.previousDay = day;
      this.periodSelectionStarted = true;
      this.setDisabledDays(this.previousDay.date, daysCount, true);
      day.type = day.holiday ? CalendarDayType.Holiday : CalendarDayType.Planned;
    }
  }

  private deletePeriod(period: Period, index: number): void {
    this.setPeriod(period, false);
    this.plannedPeriods.splice(index, 1);
  }

  private definePeriodStart(date: Date, count: number): Moment {
    let start = moment(date, this.dateFormat) as Moment;
    const range = moment().range(
      moment().year(this.year).startOf('year'),
      start
    );
    const days = range.reverseBy('days');
    const daysIter = days[Symbol.iterator]();
    let result: IteratorResult<Moment, Moment>;
    while (!(result = daysIter.next()).done && count >= 0) {
      start = result.value;
      const day = this.getCalendarDay(start);
      if (this.isDayActive(day) || day.disabled) break;
      if (day.holiday) continue;
      --count;
    }
    return start;
  }

  private definePeriodEnd(date: Date, count: number): Moment {
    let end = moment(date, this.dateFormat) as Moment;
    const range = moment().range(
      end,
      moment().year(this.year).endOf('year')
    );
    const days = range.by('days');
    const daysIter = days[Symbol.iterator]();
    let result: IteratorResult<Moment, Moment>;
    while (!(result = daysIter.next()).done && count >= 0) {
      end = result.value;
      const day = this.getCalendarDay(end);
      if (this.isDayActive(day)) break;
      if (day.holiday) continue;
      --count;
    }
    return end;
  }

  private formatPeriod(period: Period): string {
    return `${moment(period.start, this.dateFormat).format('DD.MM')} - ${moment(period.end, this.dateFormat).format('DD.MM')}`;
  }

  private setDisabledDays(date: Date, count: number, state: boolean): void {
    let yearStart: Moment;
    if (this.workPeriodStart) {
      yearStart = moment(this.workPeriodStart, this.dateFormat)
    } else {
      yearStart = moment().year(this.year).startOf('year');
    }
    const yearEnd = moment().year(this.year).endOf('year');
    const periodStart = this.definePeriodStart(date, count);
    const periodEnd = this.definePeriodEnd(date, count);
    const ranges = [
      moment.range(yearStart, periodStart),
      moment.range(periodEnd, yearEnd)
    ];
    for (const range of ranges) {
      if (range.duration('days') === 0) {
        continue;
      }
      for (const date of range.by('days')) {
        const day = this.getCalendarDay(date)
        day.disabled = state;        
      }
    }
  }

  private setPeriod(period: Period, state: boolean): void {    
    const range = moment.range(
      moment(period.start, this.dateFormat),
      moment(period.end, this.dateFormat)
    );
    for (const date of range.by('days')) {
      const day = this.getCalendarDay(date);
      if (state) {
        day.type = day.holiday ? CalendarDayType.Holiday : CalendarDayType.Planned;
      } else {
        day.type = CalendarDayType.None;
      }
    }    
  }

  private setWorkPeriodStart(workPeriodDate: string, state: boolean): void {
    const date = moment(workPeriodDate, this.dateFormat);
    if (date.year() != this.year) {
      return;
    }
    const range = moment.range(
      moment().year(this.year).startOf('year'), 
      moment(date, this.dateFormat)
    );
    for (const date of range.by('days', { excludeEnd: true })) {
      const day = this.getCalendarDay(date);
      day.disabled = state;
    }
  }

  private init(): void {
    this.initCalendar();
    this.setHolidays();
    this.periodsChange(this.periods, []);
    this.setWorkPeriodStart(this.workPeriodStart, true);
  }

  private created(): void {
    this.init();
  }

  @Watch('workPeriodStart')
  private workPeriodDateChange(val: string, oldVal: string): void {
    this.setWorkPeriodStart(oldVal, false);
    this.setWorkPeriodStart(val, true);
  } 

  @Watch('year')
  private yearChange(): void {
    this.init();
  }

  @Watch('periods')
  private periodsChange(val: Period[], oldVal: Period[]): void {
    for (const period of oldVal) {
      this.setPeriod(period, false);
    }
    for (const period of val) {
      this.setPeriod(period, true);
    }
    this.plannedPeriods = [...val];     
  }

  @Watch('plannedPeriods')
  private plannedPeriodsChange(): void {
    this.calculateActiveDays();
    this.$emit('planned-periods', this.plannedPeriods);
  }
}
</script>