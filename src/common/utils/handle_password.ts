import * as bcrypt from 'bcrypt';
export const hashPassword = async (rawPassword: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(rawPassword, saltRounds);
};
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
