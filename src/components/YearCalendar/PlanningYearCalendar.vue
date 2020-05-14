<template>
  <year-calendar
    :months="months"
    :show-periods="true"
  >
    <template #day="{ item }">
      <div
        @click="selectDay(item)"
        :class="item.classes()"
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
import { CalendarDay, CalendarDayStyle } from './models';
import { YearCalendarMixins } from './mixins';
import CloseCircle from 'vue-material-design-icons/CloseCircle.vue';

type Moment = Moment.Moment;
const moment = extendMoment(Moment);

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

  private previousDate!: Date
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

  private selectDay(day: CalendarDay): void {
    if (!this.periodSelectionStarted &&
        (this.selectedDaysNumber === this.availableDays || day.active)) {
      return;      
    }
    const daysCount = this.availableDays - this.selectedDaysNumber;
    if (this.periodSelectionStarted) {
      let startDate = this.previousDate;
      let endDate = day.date;
      if (startDate > endDate) {
        [startDate, endDate] = [endDate, startDate];
      }
      this.setDisabledDays(this.previousDate, daysCount, false);
      const period = {
        start: moment(startDate).format(this.dateFormat),
        end: moment(endDate).format(this.dateFormat)
      };
      this.setPeriod(period, true);
      this.plannedPeriods.push(period);
      this.periodSelectionStarted = false;
    } else {
      day.active = true;
      day.style = day.holiday ? CalendarDayStyle.Holiday : CalendarDayStyle.Planned;
      this.previousDate = day.date;
      this.periodSelectionStarted = true;
      this.setDisabledDays(this.previousDate, daysCount, true);
    }
  }

  private deletePeriod(period: Period, index: number): void {
    this.setPeriod(period, false);
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

  private formatPeriod(period: Period): string {
    return `${moment(period.start, this.dateFormat).format('DD.MM')} - ${moment(period.end, this.dateFormat).format('DD.MM')}`;
  }

  private setDisabledDays(date: Date | Moment, count: number, state: boolean): void {
    if (count < 0) {
      return;
    }
    const start = this.definePeriodStart(date, count);
    const end = this.definePeriodEnd(date, count);
    const endOfYear = moment().year(this.year).endOf('year');
    let startOfYear: Moment;
    if (this.workPeriodStart) {
      startOfYear = moment(this.workPeriodStart, this.dateFormat);
    } else {
      startOfYear = moment().year(this.year).startOf('year');
    }
    const ranges = [
      moment.range(startOfYear, start),
      moment.range(end, endOfYear)
    ]
    for (const range of ranges) {
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
      day.active = state;
      if (state) {
        day.style = day.holiday ? CalendarDayStyle.Holiday : CalendarDayStyle.Planned;
      } else {
        day.style = CalendarDayStyle.None;
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
    this.$emit('planned-periods', this.plannedPeriods);
  }
}
</script>