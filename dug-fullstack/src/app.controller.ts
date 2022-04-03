import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { isEqual } from 'lodash';
import { UserService } from './user.service';
import { ClassService } from './class.service';
import { AttendanceService } from './attendance.service';
import { RefNRevService } from './refNrev.service';
import {
  getWeekRange,
  DateCountsObj,
  DateWeekCountsObj,
  DateMonthCountsObj,
  ClassAttendanceObj,
} from './sharedVars';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly classService: ClassService,
    private readonly attendanceService: AttendanceService,
    private readonly refNrevService: RefNRevService,
  ) {}

  // Registers a user
  @Post('/register')
  async userRegister(
    @Res() res,
    @Body()
    userData: {
      email: string;
      password: string;
      name: string;
    },
  ) {
    const user = await this.userService.userRegister(
      userData.email,
      userData.password,
      userData.name,
    );
    return res.status(HttpStatus.OK).json({
      message: 'User created successfully!',
      user,
    });
  }

  // Logs in a user
  @Post('/login')
  async userLogin(
    @Res() res,
    @Body()
    userData: {
      email: string;
      password: string;
    },
  ) {
    const user = await this.userService.userLogin(
      userData.email,
      userData.password,
    );
    return res.status(HttpStatus.OK).json({
      message: 'User logged in successfully!',
      user,
    });
  }

  //Logs user out
  @Post('/logout')
  async userLogout(@Res() res) {
    await this.userService.userLogout();
    return res.status(HttpStatus.OK).json({
      message: 'User logged out successfully!',
    });
  }

  // Resets a user's information (all class, attendance and reflection records are deleted)
  @Get('/:userid/reset')
  async resetUserInfo(@Param('userid') userid, @Res() res) {
    console.log('Called reset');
    await this.classService.deleteClassesByUser(userid);
    await this.attendanceService.deleteAttendancesByUser(userid);
    await this.refNrevService.deleteRecordsByUser(userid);
    return res.status(HttpStatus.OK).json({
      message: 'User information deleted successfully!',
    });
  }

  //Adds a class and then the asscoiated attendance and reflection/review records
  @Post('/addClass')
  async addClass(
    @Res() res,
    @Body()
    classData: {
      coursecode: string;
      coursename: string;
      courselocation: string;
      datestart: Date;
      dateend: Date;
      dayslot: string;
      timestart: string;
      timeend: string;
      userid: string;
    },
  ) {
    const classInfo = await this.classService.addClass(
      classData.coursecode,
      classData.coursename,
      classData.courselocation,
      classData.datestart,
      classData.dateend,
      classData.dayslot,
      classData.timestart,
      classData.timeend,
      classData.userid,
    );
    await this.attendanceService.addAttendancesByClassId(
      classData.datestart,
      classData.dateend,
      classData.dayslot,
      classInfo.id,
      classData.userid,
    );
    await this.refNrevService.addRecordsByClassId(
      classData.datestart,
      classData.dateend,
      classData.dayslot,
      classInfo.id,
      classData.userid,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Class added successfully!',
      classInfo,
    });
  }

  // Updates a class and then the asscoiated attendance and reflection/review records
  @Post('/updateClass')
  async updateClass(
    @Res() res,
    @Body()
    classData: {
      id: number;
      coursecode: string;
      coursename: string;
      courselocation: string;
      datestart: Date;
      dateend: Date;
      dayslot: string;
      timestart: string;
      timeend: string;
      userid: string;
    },
  ) {
    const updatedClassInfo = await this.classService.updateClass(
      classData.id,
      classData.coursecode,
      classData.coursename,
      classData.courselocation,
      classData.datestart,
      classData.dateend,
      classData.dayslot,
      classData.timestart,
      classData.timeend,
      classData.userid,
    );
    await this.classService.updateClassAttendances(
      classData.datestart,
      classData.dateend,
      classData.dayslot,
      classData.id,
    );
    await this.classService.updateClassReflections(
      classData.datestart,
      classData.dateend,
      classData.dayslot,
      classData.id,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Class updated successfully!',
      updatedClassInfo,
    });
  }

  //Deletes class by id and then the asscoiated attendance and reflection/review records
  @Get('/deleteClass/:id')
  async deleteClassById(@Param('id') id, @Res() res) {
    await this.attendanceService.deleteAttendancesByClassId(id);
    await this.refNrevService.deleteRecordsByClassId(id);
    await this.classService.deleteClassById(id);
    return res.status(HttpStatus.OK).json({
      message: 'Class deleted successfully!',
    });
  }

  // Get user classes that are currently running
  @Post('/currentClasses')
  async getCurrentClasses(
    @Res() res,
    @Body()
    classData: {
      userid: string;
      date: Date;
    },
  ) {
    const userClasses = await this.classService.getClasses(
      classData.userid,
      classData.date,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Classes found successfully!',
      userClasses,
    });
  }

  //Gets a class by id
  @Get('/:userid/classes/byId/:id')
  async getClassById(@Param('userid') userid, @Param('id') id, @Res() res) {
    const userClasses = await this.classService.getClassById(userid, id);
    return res.status(HttpStatus.OK).json({
      message: 'Class found successfully!',
      class: userClasses[0],
    });
  }

  //Get classes by day slot
  @Get('/:userid/classes/byDays/:days')
  async getClassesByDays(
    @Param('userid') userid,
    @Param('days') days,
    @Res() res,
  ) {
    const userClasses = await this.classService.getClassesByDays(userid, days);
    return res.status(HttpStatus.OK).json({
      message: 'Class found successfully!',
      classesToday: userClasses,
    });
  }

  // Get all user classes with all reflection and review records for it
  @Get('/:userid/classesWithRecords')
  async getAllClassesWithRecords(@Param('userid') userid, @Res() res) {
    const allUserClasses = await this.classService.getAllClassesRecords(userid);
    return res.status(HttpStatus.OK).json({
      message: 'Classes found successfully!',
      allUserClasses,
    });
  }

  //Get records (reflections and review) by id
  @Get('/:classId/classWithRecords')
  async getClassAndRecordsById(@Param('classId') classId, @Res() res) {
    const classRecords = await this.classService.getClassAndRecordsById(
      classId,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Records found successfully!',
      classRecords,
    });
  }

  // Get all user classes with all attendance records for it
  @Get('/:userid/classesWithAttendance')
  async getAllClassesWithAttendance(@Param('userid') userid, @Res() res) {
    const allUserClasses = await this.classService.getAllClassesAttendance(
      userid,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Classes found successfully!',
      allUserClasses,
    });
  }

  // Updates grade for a class
  @Post('/statistics/updateGrade')
  async updateClassGrade(
    @Res() res,
    @Body()
    classData: { id: number; grade: number },
  ) {
    const updatedClass = await this.classService.updateClassGrade(
      classData.id,
      classData.grade,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Overall class avgs retrieved successfully!',
      updatedClass,
    });
  }

  // Get overall averages
  @Post('/statistics/overallAvg')
  async getOverallClassAvgs(
    @Res() res,
    @Body()
    classData: { classes: ClassAttendanceObj[] },
  ) {
    const overallClassAvgs = await this.classService.getOverallClassAvgs(
      classData.classes,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Overall class avgs retrieved successfully!',
      overallClassAvgs,
    });
  }

  // Get class average
  @Post('/statistics/classAvg')
  async getClassAvgs(
    @Res() res,
    @Body()
    classData: { classObj: ClassAttendanceObj },
  ) {
    const classAvgs = await this.classService.getClassAvgs(classData.classObj);
    return res.status(HttpStatus.OK).json({
      message: 'Class avgs retrieved successfully!',
      classAvgs,
    });
  }

  //Gets grouped attendance records (records with same date and status are grouped)
  @Get('/:userid/attendance/grouped')
  async getAttendanceGrouped(@Param('userid') userid, @Res() res) {
    const groupedAttendance = await this.attendanceService.getAttendanceGrouped(
      userid,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Classes found successfully!',
      groupedAttendance,
    });
  }

  // Gets attendance records with missed reasons (not N/A)
  @Get('/:userid/attendance/missed')
  async getMostReasonMissed(@Param('userid') userid, @Res() res) {
    const mostMissedReason = await this.attendanceService.getMostReasonMissed(
      userid,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Classes found successfully!',
      mostMissedReason,
    });
  }

  // Updates an attendance record
  @Post('/attendance/update')
  async updateAttendance(
    @Res() res,
    @Body()
    attendanceData: {
      id: number;
      status: string;
      reason: string;
    },
  ) {
    const updatedAttendance = await this.attendanceService.updateAttendance(
      attendanceData.id,
      attendanceData.status,
      attendanceData.reason,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Attendance updated successfully!',
      updatedAttendance,
    });
  }

  // Updates a reflection record
  @Post('/reflection/update')
  async updateReflection(
    @Res() res,
    @Body()
    reflectionsData: {
      id: number;
      title: string;
      content: string;
    },
  ) {
    const updatedRecord = await this.refNrevService.updateReflection(
      reflectionsData.id,
      reflectionsData.title,
      reflectionsData.content,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Reflection updated successfully!',
      updatedRecord,
    });
  }

  // Updates a review record
  @Post('/review/update')
  async updateReview(
    @Res() res,
    @Body()
    reviewsData: {
      id: number;
      title: string;
      content: string;
    },
  ) {
    const updatedRecord = await this.refNrevService.updateReview(
      reviewsData.id,
      reviewsData.title,
      reviewsData.content,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Review updated successfully!',
      updatedRecord,
    });
  }

  // Gets date counts for awards
  @Post('/awards/dateCount')
  async getDayCounts(
    @Res() res,
    @Body()
    dateCountData: { classes: ClassAttendanceObj[] },
  ) {
    console.log('Called getDayCounts', dateCountData.classes);
    const dateCountsDay = [] as DateCountsObj[];
    const dateCountsWeek = [] as DateWeekCountsObj[];
    const dateCountsMonth = [] as DateMonthCountsObj[];
    const userClasses = dateCountData.classes;
    if (userClasses) {
      userClasses.map(({ attendanceRec }) => {
        // eslint-disable-next-line array-callback-return
        return attendanceRec.map((att) => {
          const currDate = new Date(att.classDate);
          // Day handling
          let index = dateCountsDay.findIndex(
            ({ classDate }) => classDate === att.classDate,
          );
          if (index !== -1) dateCountsDay[index].classCount += 1;
          else
            dateCountsDay.push({
              classDate: att.classDate,
              classCount: 1,
              yesCount: 0,
            });
          // Month handling
          let monthIndex = dateCountsMonth.findIndex(
            ({ month, year }) =>
              month === currDate.getMonth() && year === currDate.getFullYear(),
          );
          if (monthIndex !== -1) dateCountsMonth[monthIndex].classCount += 1;
          else
            dateCountsMonth.push({
              month: currDate.getMonth(),
              year: currDate.getFullYear(),
              classCount: 1,
              yesCount: 0,
            });

          //Week handling
          const week = getWeekRange(att.classDate);
          const inDateCountsWeek = dateCountsWeek.filter(({ classDates }) =>
            isEqual(classDates, week),
          ).length;
          if (inDateCountsWeek === 0) {
            dateCountsWeek.push({
              classDates: week,
              classCount: 0,
              yesCount: 0,
            });
          } else {
            const dayIndex = dateCountsWeek.findIndex(({ classDates }) =>
              isEqual(classDates[currDate.getDay() - 1], currDate),
            );
            if (dayIndex !== -1) {
              dateCountsWeek[dayIndex].classCount += 1;
              if (att.status === 'Yes') {
                dateCountsWeek[dayIndex].yesCount += 1;
              }
            }
          }

          if (att.status === 'Yes') {
            index = dateCountsDay.findIndex(
              ({ classDate }) => classDate === att.classDate,
            );
            dateCountsDay[index].yesCount += 1;
            monthIndex = dateCountsMonth.findIndex(
              ({ month, year }) =>
                month === currDate.getMonth() &&
                year === currDate.getFullYear(),
            );
            dateCountsMonth[monthIndex].yesCount += 1;
          }
        });
      });
      const dateCounts = [dateCountsDay, dateCountsWeek, dateCountsMonth];
      return res.status(HttpStatus.OK).json({
        message: 'Date counts retrieved successfully!',
        dateCounts,
      });
    }
  }
}
