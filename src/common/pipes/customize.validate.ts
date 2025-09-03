import { BadRequestException, ValidationPipe } from '@nestjs/common';

export const CustomValidationPipe = new ValidationPipe({
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map((error) => {
      // Ưu tiên lỗi `isNotEmpty` trước nếu có
      const constraints = error.constraints || {};
      // console.log(`check constraints ${JSON.stringify(constraints)}`);
      if (constraints.isNotEmpty) {
        return {
          field: error.property,
          message: constraints.isNotEmpty, // Lỗi "không được để trống" luôn hiển thị trước
        };
      }

      return {
        field: error.property,
        message:
          Object.values(constraints).reverse().join('. ') || 'Invalid input', // Nếu không có lỗi isNotEmpty thì lấy lỗi khác
      };
    });

    return new BadRequestException({
      errors: formattedErrors,
    });
  },
  whitelist: true, // loại bỏ các trường không có trong dto trong req
});
