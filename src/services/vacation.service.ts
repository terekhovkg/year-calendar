import * as fake from '../store/fake';
import { VacationDate, Holiday } from '../models/vacation'

function getHolidays(year: number): Holiday[] {
  const request = {
    url: 'common/api/holidays',
    method: 'get',
    params: { year }
  };
  return fake.holidays;
}

function getVacationDates(id: string, year: number): VacationDate[] {
  const request = {
    url: `vacations/api/employees/${id}/schedule`,
    method: 'get',
    params: { year }
  };
  return fake.vacationDates;
}

export {
  getHolidays,
  getVacationDates
}