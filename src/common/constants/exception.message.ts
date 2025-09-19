export const ERROR_MESSAGE = {
  FILE_TYPE: 'Chỉ chấp nhận file có dạng jpg, jpeg hoặc png',

  FILE_SIZE: 'Chỉ chấp nhận file có kích thước nhỏ hơn 5MB',

  UPLOAD_FILE_FAILED: 'Lỗi upload file',

  FILE_NOT_FOUND: 'Không tìm thấy file',

  INVALID_CREDENTIALS: 'Thông tin không chính xác, vui lòng thử lại',

  UNAUTHENTICATED: 'Bạn chưa đăng nhập!',

  BLOCKED: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để khôi phục.',

  TOKEN_EXPIRED_ERROR: 'Token has expired',

  INVALID_TOKEN: 'Invalid token',

  PHONE_NUMBER_EXISTS: 'Số điện thoại này đã tồn tại',

  EMAIL_EXISTS: 'Email này đã tồn tại',

  EMAIL_NOT_FOUND: 'Email không tồn tại',

  INTERNAL_ERROR_SERVER: 'Hệ thống bận, vui lòng thử lại.',

  INVALID_CONFIRM_PASSWORD: 'Mật khẩu xác thực phải trùng với mật khẩu mới.',

  USER_NOT_FOUND: 'Không tìm thấy thông tin người dùng',

  WRONG_PASSWORD: 'Mật khẩu không chính xác!',

  DUPLICATE_PASSWORD: 'Mật khẩu mới phải khác mật khẩu hiện tại',

  EXPIRED_SESSION_LOGIN: 'Hết phiên đăng nhập',

  FORBIDDEN: 'Bạn không có quyền truy cập!',

  ROLE_NOT_FOUND: 'Role not found',

  DUPLICATE_SPECIALIZATION_NAME: 'Tên chuyên khoa đã tồn tại',

  SPECIALIZATION_NOT_FOUND: 'Không tìm thấy chuyên khoa',

  DOCTOR_NOT_FOUND: 'Không tìm thấy thông tin bác sĩ',

  WORK_SCHEDULE_TIME_INVALID: (day: string) =>
    `Thời gian lịch làm việc của ngày ${day} không hợp lệ`,

  DUPLICATED_WORK_SCHEDULE: (day: string) => `Ngày làm việc ${day} bị trùng`,

  WORK_SCHEDULE_EXISTS_IN_DB: (day: string, doctorName: string) =>
    `Ngày làm việc ${day} của bác sĩ ${doctorName} đã tồn tại`,

  INVALID_INPUT: 'Dữ liệu đầu vào không hợp lệ',

  WORK_SCHEDULE_NOT_FOUND: (entity: string) =>
    `Lịch làm việc ID=${entity} không tồn tại`,
  WORK_SCHEDULE_NOT_FOUND_STRING: 'Lịch làm việc không tồn tại',

  DOCTOR_SLOT_NOT_FOUND: 'Không tìm thấy ca khám',

  SLOT_HAS_BEEN_BOOKED_NOT_ALLOW_UPDATE:
    'Ca khám đã được đặt không thể cập nhật',

  SLOT_TIME_INVALID: 'Thời gian ca khám không hợp lệ',

  SLOT_EXISTS: 'Ca khám đã tồn tại. Thất bại',

  SLOT_UNAVAILABLE: 'Ca khám không có sẵn',

  BOOKING_DATE_TOO_FAR: 'Chỉ được đặt lịch trước tối đa 7 ngày',

  BOOKING_TIME_TOO_SHORT:
    'Thời gian đặt lịch trước tối thiếu 2 tiếng lịch khám bắt đầu',

  APPOINTMENT_NOT_FOUND: 'Không tìm thấy lịch khám',
};
