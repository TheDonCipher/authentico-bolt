import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables globally
    PrismaModule, // Import PrismaModule
    UserModule,   // Import UserModule
  ],
})
export class AppModule {}