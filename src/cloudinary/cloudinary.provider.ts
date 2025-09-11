import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ENTITIES_MESSAGE } from 'src/common/constants/entities.message';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_NAME'),
      api_key: configService.get<string>('CLOUDINARY_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_SECRET'),
    });
  },
  inject: [ConfigService],
};
