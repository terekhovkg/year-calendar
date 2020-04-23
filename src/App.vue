<template>
  <v-app>
    <v-content>
      <year-calendar 
        :year="year" 
        :show-legend="true" 
        :vacation-dates="vacationDates" 
        :available-days="availableDays"
        :holidays="holidays"
        @input="changeInput"
        :readonly="false"
        :periods.sync="periods"
      />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import YearCalendar from './components/YearCalendar.vue';
import * as vacationService from './services/vacation.service'
import { Holiday, VacationDate, Period } from './models/vacation';
import { Watch } from 'vue-property-decorator';

@Component({
  components: {
    YearCalendar
  }
})
export default class App extends Vue {
  constructor() {
    super();
    this.year = 2020;
    this.availableDays = 35;
  }
  private availableDays: number;
  private year: number;
  private holidays: Holiday[] = [];
  private vacationDates: VacationDate[] = [];
  private periods: Period[] = [
    {
      start: '01-01-2020',
      end: '10-01-2020'
    }
  ];

  private created() {
    this.holidays = vacationService.getHolidays(this.year);
    this.vacationDates = vacationService.getVacationDates('', this.year);
  }

  private changeInput(data: object[]): void {
    console.log(data);
    return;
  }

  @Watch('periods')
  changePeriods() {
    console.log(this.periods);
  }
}
</script>

<style lang="scss" scoped>
calendar {
  margin: 10px;
}
</style>