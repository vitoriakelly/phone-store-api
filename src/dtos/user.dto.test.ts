import { describe, expect, it } from 'vitest';

import {
  createEmployeeSchema,
  resetEmployeePasswordSchema,
  updateEmployeeStatusSchema,
} from './user.dto.js';

describe('user DTOs', () => {
  it('valida criação de funcionário', () => {
    const result =
      createEmployeeSchema.safeParse({
        name: 'Maria Silva',
        email: '  Maria@Loja.COM ',
        password: 'senha1234',
      });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe(
        'maria@loja.com',
      );
    }
  });

  it('rejeita nome curto na criação', () => {
    const result =
      createEmployeeSchema.safeParse({
        name: 'Al',
        email: 'al@loja.com',
        password: 'senha1234',
      });

    expect(result.success).toBe(false);
  });

  it('valida atualização de status', () => {
    const result =
      updateEmployeeStatusSchema.safeParse(
        {
          active: false,
        },
      );

    expect(result.success).toBe(true);
  });

  it('valida reset de senha', () => {
    const result =
      resetEmployeePasswordSchema.safeParse(
        {
          password: 'novasenha1',
        },
      );

    expect(result.success).toBe(true);
  });
});
