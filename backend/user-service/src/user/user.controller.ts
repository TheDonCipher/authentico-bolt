import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup/individual')
  async signUpIndividual(@Body() data: { name: string; email: string }) {
    return this.userService.createUser({ ...data, userType: 'individual' });
  }

  @Post('signup/organization')
  async signUpOrganization(@Body() data: { orgName: string; email: string }) {
    return this.userService.createUser({ name: data.orgName, email: data.email, userType: 'organization' });
  }
}