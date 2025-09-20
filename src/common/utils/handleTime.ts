import moment from 'moment-timezone';

// hàm kiểm tra thời gian hợp lệ start_time < end_time
export const checkTimeValid = (
  start_time: string,
  end_time: string,
): boolean => {
  const [sh, sm] = start_time.split(':').map(Number);
  const [eh, em] = end_time.split(':').map(Number);

  const start_minutes = sh * 60 + sm;
  const end_minutes = eh * 60 + em;

  return start_minutes < end_minutes;
};

/**
 * Chuyển đổi sang múi giờ hiện tại của server/user
 * @param date Thời gian dạng Date hoặc string
 * @param tz Múi giờ cần hiển thị (default: Asia/Ho_Chi_Minh)
 * @returns string theo format DD/MM/YYYY HH:mm:ss
 */
export function toLocalTime(
  date: Date | string,
  tz = 'Asia/Ho_Chi_Minh',
): string {
  return moment(date).tz(tz).format('DD/MM/YYYY HH:mm:ss');
}
