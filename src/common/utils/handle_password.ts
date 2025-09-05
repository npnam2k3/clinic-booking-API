import * as bcrypt from 'bcrypt';
export const hashPassword = async (rawPassword: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(rawPassword, saltRounds);
};
