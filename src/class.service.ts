import { Injectable } from '@nestjs/common';
import { Class } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { getDates, ClassAttendanceObj } from './sharedVars';

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  // Function removes the class records from the Class table of the DB that has the input class id.
  async deleteClassById(id: string): Promise<Class> {
    const classId = parseInt(id);
    return this.prisma.class.delete({
      where: {
        id: classId,
      },
    });
  }

  // Function removes all class records from the Class table of the DB that are associated with the input user id.
  async deleteClassesByUser(userid: string): Promise<void> {
    await this.prisma.class.deleteMany({
      where: {
        userId: userid,
      },
    });
  }

  // Function adds a class record to the Class table of the DB with the input course information. The grade attribute is not passed in and is 0 by default.
  async addClass(
    coursecode: string,
    coursename: string,
    courselocation: string,
    datestart: Date,
    dateend: Date,
    dayslot: string,
    timestart: string,
    timeend: string,
    userid: string,
  ): Promise<Class> {
    return this.prisma.class.create({
      data: {
        courseCode: coursecode,
        courseName: coursename,
        courseLocation: courselocation,
        dateStart: datestart,
        dateEnd: dateend,
        daySlot: dayslot,
        timeStart: timestart,
        timeEnd: timeend,
        grade: 0,
        userId: userid,
      },
    });
  }

  // Function retrieves all class records from the Class table of the DB for the input user that are currently ongoing (the date input is in the range of the class start and end dates).
  async getClasses(userid: string, date: Date): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: {
        userId: userid,
        AND: [
          {
            dateStart: {
              lte: date,
            },
          },
          {
            dateEnd: {
              gte: date,
            },
          },
        ],
      },
    });
  }

  // Function retrieves all class records (with the asscoiated attendance records) from the Class table of the DB that are associated with the input used id.
  async getAllClassesAttendance(userid: string): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: {
        userId: userid,
      },
      include: {
        attendanceRec: true,
      },
    });
  }

  //Function retrieves all class records from the Class table of the DB that are asscoiated with the input user id
  async getAllClasses(userid: string): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: {
        userId: userid,
      },
    });
  }

  //Function retrieves all review and reflection records rom the Class table of the DB that are asscoiated with the input user id
  async getAllClassesRecords(userid: string): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: {
        userId: userid,
      },
      include: {
        refNrevRec: true,
      },
    });
  }

  //Function retrieves all review and reflection records from the Class table of the DB that are asscoiated with the input class id
  async getClassAndRecordsById(id: string): Promise<Class[]> {
    const classId = parseInt(id);
    return this.prisma.class.findMany({
      where: {
        id: classId,
      },
      include: {
        refNrevRec: true,
      },
    });
  }

  //Function retrieves all class records from the Class table of the DB that are asscoiated with the input user id and has the input day slot
  async getClassesByDays(userid: string, daySlot: string): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: {
        userId: userid,
        AND: {
          daySlot: {
            contains: daySlot,
          },
        },
      },
    });
  }

  //Function retrieves all class records from the Class table of the DB that are asscoiated with the input class and user ids
  async getClassById(userid: string, id: string): Promise<Class[]> {
    const classId = parseInt(id);
    return this.prisma.class.findMany({
      where: {
        userId: userid,
        AND: {
          id: classId,
        },
      },
    });
  }

  //Function gets overall class attendance and grade percentage for all classes of a user
  async getOverallClassAvgs(classes: ClassAttendanceObj[]): Promise<number[]> {
    let totalClassOccurrence = 0;
    let classesWGrades = 0;
    let attendanceYes = 0;
    let grades = 0;
    if (classes) {
      classes.map(({ grade, attendanceRec }) => {
        // Only takes into account populated grades
        if (grade !== 0) {
          classesWGrades += 1;
          grades += grade;
        }
        if (attendanceRec) {
          totalClassOccurrence += attendanceRec.length;
          // eslint-disable-next-line array-callback-return
          return attendanceRec.map((att) => {
            if (att.status === 'Yes') {
              attendanceYes += 1;
            }
          });
        }
      });
    }
    const overallAttAvg = (attendanceYes / totalClassOccurrence) * 100 || 0;
    const overallGrAvg = grades / classesWGrades || 0;
    return [
      parseFloat(overallAttAvg.toFixed(1)),
      parseFloat(overallGrAvg.toFixed(1)),
    ];
  }

  //Function gets class grade percent and attendance avg percentage for a specific user class
  async getClassAvgs(classObj: ClassAttendanceObj): Promise<number[]> {
    let totalClassOccurrence = 0;
    let attendancecYes = 0;
    if (classObj) {
      if (classObj.attendanceRec) {
        totalClassOccurrence += classObj.attendanceRec.length;
        classObj.attendanceRec.map((att) => {
          if (att.status === 'Yes') {
            attendancecYes += 1;
          }
        });
      }
    }
    const courseAttAvg = (attendancecYes / totalClassOccurrence) * 100 || 0;
    const courseGrAvg = classObj.grade;
    return [
      parseFloat(courseAttAvg.toFixed(1)),
      parseFloat(courseGrAvg.toFixed(1)),
    ];
  }

  /*
    Function updates the associated attendance records of the Attendance table of the DB with the new class dates for the input class id. 
    Based on the changed dates either the records stay the same but the dates are reassigned, more records are added, or extra records are deleted. 
  */
  async updateClassAttendances(
    datestart: Date,
    dateend: Date,
    dayslot: string,
    classid: number,
  ): Promise<void> {
    let diff;
    const attendances = await this.prisma.attendance.findMany({
      where: {
        classId: classid,
      },
    });
    const dates = getDates(datestart, dateend, dayslot);
    if (attendances.length === dates.length) {
      attendances.forEach(async (attendance, index) => {
        await this.prisma.attendance.update({
          where: {
            id: attendance.id,
          },
          data: {
            classDate: dates[index],
            status: attendance.status,
            classId: classid,
          },
        });
      });
    } else if (attendances.length > dates.length) {
      diff = attendances.length - dates.length;
      for (let i = 0; i < attendances.length - diff; i++) {
        await this.prisma.attendance.update({
          where: {
            id: attendances[i].id,
          },
          data: {
            classDate: dates[i],
            status: attendances[i].status,
            classId: classid,
          },
        });
      }
      for (let i = attendances.length - diff; i < attendances.length; i++) {
        await this.prisma.attendance.delete({
          where: {
            id: attendances[i].id,
          },
        });
      }
    } else if (attendances.length < dates.length) {
      diff = dates.length - attendances.length;
      attendances.forEach(async (attendance, index) => {
        await this.prisma.attendance.update({
          where: {
            id: attendance.id,
          },
          data: {
            classDate: dates[index],
            status: attendance.status,
            classId: classid,
          },
        });
      });
      for (let i = dates.length - diff; i < dates.length; i++) {
        await this.prisma.attendance.create({
          data: {
            classDate: dates[i],
            status: 'Unknown',
            classId: classid,
          },
        });
      }
    }
  }

  /*
    Function updates the associated reflection and review records of the ReflectionReview table of the DB with the new class dates for the input class id. 
    Based on the changed dates either the records stay the same but the dates are reassigned, more records are added, or extra records are deleted. 
  */
  async updateClassReflections(
    datestart: Date,
    dateend: Date,
    dayslot: string,
    classid: number,
  ): Promise<void> {
    let diff;
    const reflections = await this.prisma.reflectionReview.findMany({
      where: {
        classId: classid,
      },
    });
    const dates = getDates(datestart, dateend, dayslot);
    if (reflections.length === dates.length) {
      reflections.forEach(async (refl, index) => {
        await this.prisma.reflectionReview.update({
          where: {
            id: refl.id,
          },
          data: {
            classDate: dates[index],
            title: refl.title,
            refContent: refl.refContent ? refl.refContent : null,
            revContent: refl.revContent ? refl.revContent : null,
            classId: classid,
          },
        });
      });
    } else if (reflections.length > dates.length) {
      diff = reflections.length - dates.length;
      for (let i = 0; i < reflections.length - diff; i++) {
        await this.prisma.reflectionReview.update({
          where: {
            id: reflections[i].id,
          },
          data: {
            classDate: dates[i],
            title: reflections[i].title,
            refContent: reflections[i].refContent
              ? reflections[i].refContent
              : null,
            revContent: reflections[i].revContent
              ? reflections[i].revContent
              : null,
            classId: classid,
          },
        });
      }
      for (let i = reflections.length - diff; i < reflections.length; i++) {
        await this.prisma.reflectionReview.delete({
          where: {
            id: reflections[i].id,
          },
        });
      }
    } else if (reflections.length < dates.length) {
      diff = dates.length - reflections.length;
      reflections.forEach(async (refl, index) => {
        await this.prisma.reflectionReview.update({
          where: {
            id: refl.id,
          },
          data: {
            classDate: dates[index],
            title: refl.title,
            refContent: refl.refContent ? refl.refContent : null,
            revContent: refl.revContent ? refl.revContent : null,
            classId: classid,
          },
        });
      });
      for (let i = dates.length - diff; i < dates.length; i++) {
        await this.prisma.reflectionReview.create({
          data: {
            classDate: dates[i],
            title: 'N/A',
            classId: classid,
          },
        });
      }
    }
  }

  //Function updates the input information of the course from the Class table of the DB that has the input class id.
  async updateClass(
    id: number,
    coursecode: string,
    coursename: string,
    courselocation: string,
    datestart: Date,
    dateend: Date,
    dayslot: string,
    timestart: string,
    timeend: string,
    grade: number,
    userid: string,
  ): Promise<Class> {
    return this.prisma.class.update({
      where: {
        id: id,
      },
      data: {
        courseCode: coursecode,
        courseName: coursename,
        courseLocation: courselocation,
        dateStart: datestart,
        dateEnd: dateend,
        daySlot: dayslot,
        timeStart: timestart,
        timeEnd: timeend,
        grade: grade,
        userId: userid,
      },
    });
  }

  //Function updates the grade of the course from the Class table of the DB that has the input class id with the input grade.
  async updateClassGrade(id: number, grade: number): Promise<Class> {
    return this.prisma.class.update({
      where: {
        id: id,
      },
      data: {
        grade: grade,
      },
      include: {
        attendanceRec: true,
      },
    });
  }
}
