import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ secure_url: string; public_id: string }> {
    if (!file || !file.buffer)
      throw new BadRequestException(ERROR_MESSAGE.FILE_NOT_FOUND);
    return new Promise((resolve, reject) => {
      // tạo 1 cửa để truyền dữ liệu lên cloudinary server (writable stream)
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'clinic-booking' },
        (error, result: UploadApiResponse) => {
          if (error)
            return reject(
              // lỗi trên cloudinay
              new InternalServerErrorException(
                ERROR_MESSAGE.UPLOAD_FILE_FAILED,
              ),
            );
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      // tạo 1 cửa để đọc dữ liệu từ memory (RAM) khi file đã được đọc vào buffer sau khi đi qua tầng validate file ( @UseInterceptors(FileInterceptor('avatar', multerOptions))) (readable stream)
      const readableStream = Readable.from(file.buffer); // Stream từ buffer

      // bắt lỗi đọc file từ RAM
      readableStream.on('error', (err) => {
        uploadStream.destroy();
        console.log(`Lỗi đọc file từ bộ nhớ: `, err.message);
        reject(
          new InternalServerErrorException(ERROR_MESSAGE.UPLOAD_FILE_FAILED),
        );
      });

      // bắt lỗi ghi dữ liệu lên cloudinary
      uploadStream.on('error', (err) => {
        console.log(`Lỗi ghi dữ liệu lên Cloudinary::`, err.message);
        reject(
          new InternalServerErrorException(ERROR_MESSAGE.UPLOAD_FILE_FAILED),
        );
      });

      // tạo pipe (đường ống) nối 2 cửa
      readableStream.pipe(uploadStream);
    });
  }

  async deleteFile(imageUrl: string): Promise<void> {
    const publicId = this.getPublicIdFromUrl(imageUrl);
    await cloudinary.uploader.destroy(publicId);
  }

  private getPublicIdFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1].split('.')[0];
  }
}
