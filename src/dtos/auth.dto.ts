import { z } from 'zod';

const normalizedEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value
      .trim()
      .toLowerCase();
  },
  z.email({
    message:
      'Informe um endereço de e-mail válido.',
  }),
);

export const loginSchema = z.object({
  email: normalizedEmailSchema,

  password: z
    .string({
      message:
        'A senha deve ser informada.',
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

export type LoginInput =
  z.infer<typeof loginSchema>;