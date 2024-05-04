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

export interface UpdateUserData {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  role?: 'ZICREDIT' | 'SELLER' | 'COMPANY' | 'INVESTOR';
  password?: string;
}
