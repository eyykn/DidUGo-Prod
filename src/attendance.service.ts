import { Injectable } from '@nestjs/common';
import { Attendance } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { getDates, MostMissedObj } from './sharedVars';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Function retrieves attendance records that are associated with the input user id from the Attendance table of the DB that have a missed reason entered.
  async getMostReasonMissed(userid: string): Promise<MostMissedObj[]> {
    return this.prisma.attendance.findMany({
      where: {
        userId: userid,
        NOT: {
          reason: 'N/A',
        },
      },
      select: {
        classId: true,
        reason: true,
      },
    });
  }

  /* 
    Function retrieves attendance records that are associated with the input user id from the Attendance table of the DB grouped by the date and status they have.
    This means that records with the same date and attendance status will be in the returned array once.
  */
  async getAttendanceGrouped(userid: string): Promise<any> {
    return this.prisma.attendance.groupBy({
      where: {
        userId: userid,
      },
      by: ['classDate', 'status'],
      orderBy: {
        classDate: 'asc',
      },
    });
  }

  // Function removes all attendance records from the Attendance table of the DB that are associated with the input class id.
  async deleteAttendancesByClassId(classid: string): Promise<void> {
    const classId = parseInt(classid);
    await this.prisma.attendance.deleteMany({
      where: {
        classId: classId,
      },
    });
  }

  // Function removes all attendance records from the Attendance table of the DB that are associated with the input user id.
  async deleteAttendancesByUser(userid: string): Promise<void> {
    await this.prisma.attendance.deleteMany({
      where: {
        userId: userid,
      },
    });
  }

  // Function updates empty ttendance records from the Attendance table of the DB with the information passed in.
  async updateAttendance(
    id: number,
    status: string,
    reason: string,
  ): Promise<Attendance> {
    return this.prisma.attendance.update({
      where: {
        id: id,
      },
      data: {
        status: status,
        reason: reason,
      },
    });
  }

  // Function adds empty attendance records to the Attendance table of the DB for a class given the required class and user information.
  async addAttendancesByClassId(
    datestart: Date,
    dateend: Date,
    dayslot: string,
    classid: number,
    userid: string,
  ): Promise<void> {
    // Gets the dates that the attendance records would be for.
    const dates = getDates(datestart, dateend, dayslot);
    dates.forEach(
      async (date) =>
        await this.prisma.attendance.create({
          data: {
            classDate: date,
            status: 'Unknown',
            classId: classid,
            userId: userid,
          },
        }),
    );
  }
}
