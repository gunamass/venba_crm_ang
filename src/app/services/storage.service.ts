import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  courses = [
    'Web Development',
    'Data Science',
    'UI/UX Design',
    'Frontend',
    'java backend',
    'video edit',
    'graphic',
    'digital marketing',
  ];

  constructor() {}

  generateAttendanceDates(
    startDate: string,
    endDate: string,
    numberOfClasses: number,
    category: 'weekend' | 'weekday',
    selectedWeekdays: string[] = [] // e.g., ['Monday', 'Wednesday']
  ): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: string[] = [];

    const weekdaysMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const selectedDays =
      category === 'weekend'
        ? [0, 6] // Sunday, Saturday
        : selectedWeekdays.map((day) => weekdaysMap[day]);

    let current = new Date(start);

    while (current <= end && result.length < numberOfClasses) {
      const day = current.getDay();
      if (selectedDays.includes(day)) {
        result.push(current.toISOString().split('T')[0]); // Format: YYYY-MM-DD
      }
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  calculateAttendanceSummary(attendance: any[]) {
    const today = new Date();
    let summary = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      none: 0,
    };

    attendance.forEach((record) => {
      const recordDate = new Date(record.date);

      if (recordDate > today) {
        // Future class
        summary.none++;
      } else {
        // Past or current class → count based on attend status
        switch (record.attend.toLowerCase()) {
          case 'present':
            summary.present++;
            break;
          case 'absent':
            summary.absent++;
            break;
          case 'late':
            summary.late++;
            break;
          case 'leave':
            summary.leave++;
            break;
          default:
            summary.none++;
            break;
        }
      }
    });

    return summary;
  }
}
