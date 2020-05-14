<template>
  <v-app>
    <v-content>
      <planning-year-calendar
        :year="year"
        :holidays="holidays"
        :available-days="availableDays"
        :periods="periods"
        :work-period-start="workPeriodStart"
        @planned-periods="plannedPeriods"
      />
      <schedule-year-calendar
        :year="year"
        :holidays="holidays"
        :vacation-dates="vacationDates"
      />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import PlanningYearCalendar from './components/YearCalendar/PlanningYearCalendar.vue';
import ScheduleYearCalendar from './components/YearCalendar/ScheduleYearCalendar.vue';
import * as vacationService from './services/vacation.service'
import { Holiday, VacationDate, Period } from './models/vacation';

@Component({
  components: {
    PlanningYearCalendar,
    ScheduleYearCalendar
  }
})
export default class App extends Vue {
  constructor() {
    super();
    this.year = 2020;
    this.availableDays = 35;
    this.workPeriodStart = '15-01-2020';
  }
  private availableDays: number;
  private year: number;
  private holidays: Holiday[] = [];
  private vacationDates: VacationDate[] = [];
  private workPeriodStart: string;
  private periods: Period[] = [
    {
      start: '03-02-2020',
      end: '16-02-2020'
    }
  ];

  private created(): void {
    this.holidays = vacationService.getHolidays(this.year);
    this.vacationDates = vacationService.getVacationDates('', this.year);
  }

  private plannedPeriods(periods: Period[]): void {
    console.log(periods);
  }
}
</script>

<style lang="scss" scoped>
calendar {
  margin: 10px;
}
</style>