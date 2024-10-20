import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: { name: string; email: string; userType: string; walletAddress: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async getUserByWalletAddress(walletAddress: string) {
    return this.prisma.user.findFirst({
      where: { walletAddress },
    });
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Add more methods as needed
}
