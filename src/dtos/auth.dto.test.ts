import { describe, expect, it } from 'vitest';

import { loginSchema } from './auth.dto.js';

describe('loginSchema', () => {
  it('aceita credenciais válidas e normaliza o e-mail', () => {
    const result = loginSchema.safeParse(
      {
        email: '  Admin@Loja.COM ',
        password: 'senha1234',
      },
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe(
        'admin@loja.com',
      );
    }
  });

  it('rejeita e-mail inválido', () => {
    const result = loginSchema.safeParse(
      {
        email: 'nao-e-email',
        password: 'senha1234',
      },
    );

    expect(result.success).toBe(false);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = loginSchema.safeParse(
      {
        email: 'admin@loja.com',
        password: '123',
      },
    );

    expect(result.success).toBe(false);
  });
});
