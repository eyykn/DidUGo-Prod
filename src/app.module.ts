import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';
import { ClassService } from './class.service';
import { AttendanceService } from './attendance.service';
import { RefNRevService } from './refNrev.service';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'build'),
    }),
  ],
  controllers: [AppController],
  providers: [
    UserService,
    ClassService,
    AttendanceService,
    PrismaService,
    RefNRevService,
  ],
})
export class AppModule {}
