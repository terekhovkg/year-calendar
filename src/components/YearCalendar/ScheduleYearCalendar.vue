<template>
  <year-calendar
    :months="months"
    :show-periods="false"  
  >
    <template #day="{ item }">
      <div
        :class="item.classes()"
      >
        {{ item.value }}
      </div>
    </template>
  </year-calendar>
</template>

<script lang="ts">
import YearCalendar from './YearCalendar.vue';
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import moment from 'moment';
import { VacationDate, VacationDateType } from '../../models/vacation';
import { CalendarDayStyle } from './models';
import { YearCalendarMixins } from './mixins';

@Component({
  components: {
    YearCalendar
  }
})
export default class ScheduleYearCalendar extends Mixins(YearCalendarMixins) {  
  @Prop({ default: () => [] }) readonly vacationDates!: VacationDate[];

  private setVacationDate(vacationDate: VacationDate, state: boolean): void {
    const date = moment(vacationDate.date, this.dateFormat);
    if (date.year() !== this.year) {
      return;
    }
    const day = this.getCalendarDay(date)
    day.active = state;
    if (state) {
      day.style = this.mapTypeToStyle(vacationDate.type);
    } else {
      day.style = CalendarDayStyle.None;
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
        return CalendarDayStyle.Holiday;
      }
      default: {
        return CalendarDayStyle.None
      }
    }
  }

  private init(): void {
    this.initCalendar();
    this.setHolidays();
    this.changeVacationDates(this.vacationDates, []);
  }

  private created(): void {
    this.init();
  }

  @Watch('year')
  private yearChange(): void {
    this.init();
  }

  @Watch('vacationDates')
  private changeVacationDates(val: VacationDate[], oldVal: VacationDate[]): void {
    for (const vacationDate of oldVal) {
      this.setVacationDate(vacationDate, false);
    }
    for (const vacationDate of val) {
      this.setVacationDate(vacationDate, true);
    }
  }
}
</script>