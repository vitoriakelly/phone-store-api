import { z } from 'zod';

const normalizedEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim().toLowerCase();
  },
  z.email({
    message: 'Informe um endereço de e-mail válido.',
  }),
);

export const createEmployeeSchema = z.object({
  name: z
    .string({
      message: 'O nome deve ser informado.',
    })
    .trim()
    .min(
      3,
      'O nome deve possuir pelo menos 3 caracteres.',
    )
    .max(
      160,
      'O nome deve possuir no máximo 160 caracteres.',
    ),

  email: normalizedEmailSchema,

  password: z
    .string({
      message: 'A senha deve ser informada.',
    })
    .min(
      8,
      'A senha deve possuir pelo menos 8 caracteres.',
    )
    .max(
      72,
      'A senha deve possuir no máximo 72 caracteres.',
    ),
});

export const updateEmployeeStatusSchema = z.object({
  active: z.boolean({
    message:
      'O status do funcionário deve ser informado.',
  }),
});

export const resetEmployeePasswordSchema = z.object({
  password: z
    .string({
      message: 'A nova senha deve ser informada.',
    })
    .min(
      8,
      'A nova senha deve possuir pelo menos 8 caracteres.',
    )
    .max(
      72,
      'A nova senha deve possuir no máximo 72 caracteres.',
    ),
});

export const employeeIdParamsSchema = z.object({
  id: z.uuid({
    message: 'O identificador do funcionário é inválido.',
  }),
});

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;

export type UpdateEmployeeStatusInput = z.infer<
  typeof updateEmployeeStatusSchema
>;

export type ResetEmployeePasswordInput = z.infer<
  typeof resetEmployeePasswordSchema
>;