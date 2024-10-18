import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting bootstrap function');
  try {
    console.log('Creating NestJS application');
    const app = await NestFactory.create(AppModule);
    
    console.log('Application created successfully');
    
    const port = process.env.PORT || 3003;
    console.log(`Attempting to start server on port ${port}`);
    
    await app.listen(port);
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    console.error('Error during application bootstrap:', error);
    process.exit(1);
  }
}

console.log('Calling bootstrap function');
bootstrap().catch(err => {
  console.error('Unhandled error during bootstrap:', err);
  process.exit(1);
});
