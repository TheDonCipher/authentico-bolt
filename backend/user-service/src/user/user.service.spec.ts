import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('/users (POST) - individual', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe@example.com', userType: 'individual' })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { email: 'john.doe@example.com' },
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john.doe@example.com');
    expect(user.userType).toBe('individual');
  });

  it('/users (POST) - organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Acme Corp', email: 'contact@acme.com', userType: 'organization' })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { email: 'contact@acme.com' },
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('Acme Corp');
    expect(user.email).toBe('contact@acme.com');
    expect(user.userType).toBe('organization');
  });
});