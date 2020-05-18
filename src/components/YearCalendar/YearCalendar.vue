<template>
  <div class="container">
    <div class="legend">
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
          <tr v-for="(row, index) in monthRows" :key="index">
            <td v-for="(month, index) in getMonthRow(row)" :key="`month-${index}`">
              <div class="calendar-month">
                <div class="month-title">
                  <div class="month-spacer"></div>
                  <div class="month-name">{{ month.name }}</div>
                  <div class="days-count">
                    <div v-if="month.activeDays > 0">{{ formatActiveDays(month) }}</div>
                  </div>
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
                        <td v-for="(day, index) in getWeekRow(month, week)" :key="`day-${index}`">
                          <slot v-if="day.value > 0" name="day" :item="day"></slot>
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
    <slot name="periods" v-if="showPeriods"></slot>    
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { LegendItem, CalendarMonth, CalendarDay } from './models';
import { declOfNum } from '../../utils/common';

@Component
export default class YearCalendar extends Vue {
  @Prop({ default: false }) readonly showPeriods!: boolean;  
  @Prop({ required: true }) readonly months!: CalendarMonth[];
  
  private readonly daysInWeek: number = 7;
  private readonly monthRows: number = 3;
  private readonly monthsPerRow: number = 4;  
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
  ];

  private getMonthRow(row: number): CalendarMonth[] {
    return this.months.slice((row - 1) * this.monthsPerRow, row * this.monthsPerRow);
  }

  private getWeekRow(month: CalendarMonth, week: number): CalendarDay[] {
    return month.days.slice(
      (week - 1) * this.daysInWeek, 
      week * this.daysInWeek
    );
  }

  private formatActiveDays(month: CalendarMonth): string {
    return `${month.activeDays} ${declOfNum(month.activeDays, ['день', 'дня', 'дней'])}`;
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

    .period-item--disabled {
      opacity: 0.38;
      cursor: none;
      pointer-events: none;
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