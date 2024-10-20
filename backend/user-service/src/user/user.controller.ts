import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup/individual')
  async signUpIndividual(@Body() data: { name: string; email: string; walletAddress: string }) {
    return this.userService.createUser({ ...data, userType: 'individual' });
  }

  @Post('signup/organization')
  async signUpOrganization(@Body() data: { orgName: string; email: string; walletAddress: string }) {
    return this.userService.createUser({ name: data.orgName, email: data.email, userType: 'organization', walletAddress: data.walletAddress });
  }

  @Get(':walletAddress')
  async getUserByWalletAddress(@Param('walletAddress') walletAddress: string) {
    const user = await this.userService.getUserByWalletAddress(walletAddress);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}