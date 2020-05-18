<template>
  <year-calendar
    :months="months"
    :show-periods="false"  
  >
    <template #day="{ item }">
      <div
        class="day--disabled"
        :class="dayClasses(item)"
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
import { CalendarDayType } from './models';
import { YearCalendarMixins } from './mixins';

@Component({
  components: {
    YearCalendar
  }
})
export default class ScheduleYearCalendar extends Mixins(YearCalendarMixins) {  
  @Prop({ default: () => [] }) readonly vacationDates!: VacationDate[];

  private setVacationDate(vacationDates: VacationDate[], state: boolean): void {
    for (const vacationDate of vacationDates) {
      const date = moment(vacationDate.date, this.dateFormat);
      if (date.year() !== this.year) {
        return;
      }
      const day = this.getCalendarDay(date)
      if (state) {
        day.type = this.mapTypeToStyle(vacationDate.type);
      } else {
        day.type = CalendarDayType.None;
      } 
    }   
  } 

  private mapTypeToStyle(type: VacationDateType): CalendarDayType {
    switch (type) {
      case VacationDateType.Planned: {
        return CalendarDayType.Planned;
      }
      case VacationDateType.ScheduleUsed: {
        return CalendarDayType.ScheduleUsed;
      }
      case VacationDateType.OffScheduleUsed: {
        return CalendarDayType.OffScheduleUsed;
      }
      case VacationDateType.Recall: {
        return CalendarDayType.Recall;
      }
      case VacationDateType.Holiday: {
        return CalendarDayType.Holiday;
      }
      default: {
        return CalendarDayType.None
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
    this.setVacationDate(oldVal, false);    
    this.setVacationDate(val, true);  
    this.calculateActiveDays();  
  }
}
</script>

<style lang="scss" scoped>
.day--disabled {
  opacity: 1;
}
</style>