import { Roles } from '@prisma/client';

export class User {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  verified: boolean;
  createdAt: Date;
  role: Roles;
}
