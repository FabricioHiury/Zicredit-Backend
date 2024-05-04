import { Company, User } from '@prisma/client';

export interface UserToken {
  access_token: string;
  user: User;
}
