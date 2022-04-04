import { Injectable } from '@nestjs/common';
import { ReflectionReview } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { getDates } from './sharedVars';

@Injectable()
export class RefNRevService {
  constructor(private prisma: PrismaService) {}

  // Function adds empty reflection/review records to the ReflectionReview table of the DB for a class given the required class and user information.
  async addRecordsByClassId(
    datestart: Date,
    dateend: Date,
    dayslot: string,
    classid: number,
    userid: string,
  ): Promise<void> {
    // Gets the dates that the reflection/review records would be for.
    const dates = getDates(datestart, dateend, dayslot);
    dates.forEach(
      async (date) =>
        await this.prisma.reflectionReview.create({
          data: {
            classDate: date,
            title: 'N/A',
            classId: classid,
            userId: userid,
          },
        }),
    );
  }

  // Function removes all reflection/review records from the ReflectionReview table of the DB that are associated with the input class id.
  async deleteRecordsByClassId(classid: string): Promise<void> {
    const classId = parseInt(classid);
    await this.prisma.reflectionReview.deleteMany({
      where: {
        classId: classId,
      },
    });
  }

  // Function removes all reflection/review records from the ReflectionReview table of the DB that are associated with the input user id.
  async deleteRecordsByUser(userid: string): Promise<void> {
    await this.prisma.reflectionReview.deleteMany({
      where: {
        userId: userid,
      },
    });
  }

  // Function retrieves all reflection/review records from the ReflectionReview table of the DB that have the date passed in.
  async getTodayRecords(classdate: Date): Promise<ReflectionReview[]> {
    return this.prisma.reflectionReview.findMany({
      where: {
        classDate: classdate,
      },
    });
  }

  // Function updates empty reflection records from the ReflectionReview table of the DB with the information passed in.
  async updateReflection(
    id: number,
    title: string,
    content: string,
  ): Promise<ReflectionReview> {
    return this.prisma.reflectionReview.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        refContent: content,
      },
    });
  }

  // Function updates empty review records from the ReflectionReview table of the DB with the information passed in.
  async updateReview(
    id: number,
    title: string,
    content: string,
  ): Promise<ReflectionReview> {
    return this.prisma.reflectionReview.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        revContent: content,
      },
    });
  }
}
