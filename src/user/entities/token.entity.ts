interface User {
  id: string;
  cpf: string;
  name: string;
}

export class Token {
  public id: string;
  public token: string;
  public expiresAt: Date;
  public usedAt: Date | null;
  public createdAt: Date;
  public userId?: string;

  constructor(data: Omit<Token, 'inactivate'>) {
    Object.assign(this, data);
  }

  static generate(data: Omit<Token, 'inactivate'>): Token {
    return new Token(data);
  }

  public inactivate() {
    this.usedAt = new Date();
  }
}

export interface TokenRepository {
  save(token: Omit<Token, 'inactivate'>): Promise<Token>;
}
