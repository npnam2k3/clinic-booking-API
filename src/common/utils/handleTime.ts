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
