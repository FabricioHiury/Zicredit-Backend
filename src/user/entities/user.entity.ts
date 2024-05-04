import { Roles } from '@prisma/client';

export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  created_at: Date;
  role: Roles;
}
