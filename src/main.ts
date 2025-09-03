import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from 'src/common/pipes/customize.validate';
import { AllExceptionFilter } from 'src/common/filters/handleException';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port: number = configService.get<number>('app.port', 5000);
  const client_url: string = configService.get<string>('client_url', '');

  app.enableCors({
    origin: client_url,
    credentials: true, // cho phép gửi cookie, header
    exposedHeaders: ['Content-Disposition'], // Cho phép frontend đọc header khi tải file
  });

  app.use(cookieParser());
  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new AllExceptionFilter());

  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
