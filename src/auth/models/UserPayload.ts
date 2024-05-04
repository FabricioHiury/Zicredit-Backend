export interface UserPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  identifier: string;
  id: string;
  company?: {
    id: string;
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    bankDetails: string;
  };
}