import * as bcrypt from 'bcrypt';
export const hashRefreshToken = async (refreshToken: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(refreshToken, salt);
};
export const compareRefreshToken = async (
  refreshToken: string,
  hashedRefreshToken: string,
): Promise<boolean> => {
  return await bcrypt.compare(refreshToken, hashedRefreshToken);
};
