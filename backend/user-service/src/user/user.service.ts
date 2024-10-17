import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: { name: string; email: string; userType: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Add more methods as needed
}