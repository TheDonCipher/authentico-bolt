import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUpIndividual', () => {
    it('should call UserService.createUser with individual user data', async () => {
      const createUserSpy = jest.spyOn(service, 'createUser').mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'individual',
      });

      const result = await controller.signUpIndividual({
        name: 'John Doe',
        email: 'john.doe@example.com',
      });

      expect(createUserSpy).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'individual',
      });
      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'individual',
      });
    });
  });

  describe('signUpOrganization', () => {
    it('should call UserService.createUser with organization user data', async () => {
      const createUserSpy = jest.spyOn(service, 'createUser').mockResolvedValue({
        id: 1,
        name: 'Acme Corp',
        email: 'contact@acme.com',
        userType: 'organization',
      });

      const result = await controller.signUpOrganization({
        orgName: 'Acme Corp',
        email: 'contact@acme.com',
      });

      expect(createUserSpy).toHaveBeenCalledWith({
        name: 'Acme Corp',
        email: 'contact@acme.com',
        userType: 'organization',
      });
      expect(result).toEqual({
        id: 1,
        name: 'Acme Corp',
        email: 'contact@acme.com',
        userType: 'organization',
      });
    });
  });
});