// This file contains interfaces, variables and functions that are used among multiple files in the backend.

// Maps days as strings to numbers
interface StringDaysObject {
  [key: string]: number;
}

// Interface for Attendance table
interface AttendanceObj {
  id: number;
  classDate: Date;
  courseName: string;
  status: string;
  reason?: string;
  classId: number;
}

interface DateCountsObj {
  classDate: string;
  classCount: number;
  yesCount: number;
}

interface DateWeekCountsObj {
  classDates: string[];
  classCount: number;
  yesCount: number;
}

interface DateMonthCountsObj {
  month: number;
  year: number;
  classCount: number;
  yesCount: number;
}

// Interface for Class table when attendance is included as well
interface ClassAttendanceObj {
  id: number;
  courseCode: string;
  courseName: string;
  courseLocation: string;
  dateStart: Date;
  dateEnd: Date;
  daySlot: string;
  timeStart: string;
  timeEnd: string;
  grade: number;
  attendanceRec: AttendanceObj[];
}

interface MostMissedObj {
  classId: number;
  reason: string;
}

const daysOfWeek = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
} as StringDaysObject;

/* 
  Function that takes in the start and end dates as well as day slot for a class and then returns an array of dates that the class would occur between the start and end dates.
  The dates returned are in accordance with the dayslot passed in.
*/
const getDates = (datestart: Date, dateend: Date, daySlot: string): Date[] => {
  const dates = [];
  const endDate = new Date(dateend);
  let currDate = new Date(datestart);
  const days = [daysOfWeek[daySlot.substring(0, 3)]];
  if (daySlot.length > 3) {
    days.push(daysOfWeek[daySlot.substring(3)]);
  }
  while (currDate <= endDate) {
    if (days.includes(currDate.getDay())) {
      dates.push(currDate);
    }
    const tempDate = new Date(currDate);
    currDate = new Date(tempDate.setDate(tempDate.getDate() + 1));
  }
  return dates;
};

// Function that takes in the current date and returns an array of dates that are in the week of that date (only weekdays).
const getWeekRange = (currDate: Date): Date[] => {
  const dates = [];
  let dateNum = new Date(currDate).getDay();
  while (dateNum > 1) {
    const tempDate = new Date(currDate);
    currDate = new Date(tempDate.setDate(tempDate.getDate() - 1));
    dateNum = currDate.getDay();
  }
  dates.push(new Date(currDate));
  while (dateNum < 5 && dateNum >= 1) {
    const tempDate = new Date(currDate);
    currDate = new Date(tempDate.setDate(tempDate.getDate() + 1));
    dateNum = currDate.getDay();
    if (!dates.includes(currDate)) dates.push(currDate);
  }
  return dates;
};

// Function maps an array of dates array of date strings
const getMappedWeek = (dates: Date[]): string[] => {
  return dates.map((cD) => {
    return new Date(cD).toDateString();
  });
};

export type {
  AttendanceObj,
  MostMissedObj,
  DateCountsObj,
  DateWeekCountsObj,
  DateMonthCountsObj,
  ClassAttendanceObj,
};
export { getDates, getWeekRange, getMappedWeek };
