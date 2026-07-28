import { z } from 'zod';

export const deviceStatusSchema = z.enum([
  'DISPONIVEL',
  'RESERVADO',
  'VENDIDO',
]);

export const deviceConditionSchema = z.enum([
  'NOVO',
  'SEMINOVO',
  'USADO',
]);

const devicePayloadSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(2, 'A marca deve possuir pelo menos 2 caracteres.')
    .max(80, 'A marca deve possuir no máximo 80 caracteres.'),

  model: z
    .string()
    .trim()
    .min(2, 'O modelo deve possuir pelo menos 2 caracteres.')
    .max(120, 'O modelo deve possuir no máximo 120 caracteres.'),

  storage: z
    .string()
    .trim()
    .min(1, 'Informe o armazenamento.')
    .max(30, 'O armazenamento deve possuir no máximo 30 caracteres.'),

  color: z
    .string()
    .trim()
    .min(2, 'Informe a cor do aparelho.')
    .max(50, 'A cor deve possuir no máximo 50 caracteres.'),

  imei: z
    .string()
    .trim()
    .regex(
      /^\d{15}$/,
      'O IMEI deve possuir exatamente 15 números.',
    ),

  batteryHealth: z
    .number()
    .int('A saúde da bateria deve ser um número inteiro.')
    .min(0, 'A saúde da bateria não pode ser menor que 0%.')
    .max(100, 'A saúde da bateria não pode ser maior que 100%.')
    .nullable()
    .optional(),

  condition: deviceConditionSchema,

  purchasePrice: z
    .number()
    .positive('O valor de compra deve ser maior que zero.'),

  salePrice: z
    .number()
    .positive('O valor de venda deve ser maior que zero.'),

  supplier: z
    .string()
    .trim()
    .max(
      160,
      'O fornecedor deve possuir no máximo 160 caracteres.',
    )
    .nullable()
    .optional(),

  entryDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'A data de entrada deve estar no formato AAAA-MM-DD.',
    )
    .refine(
      (value) =>
        !Number.isNaN(
          Date.parse(`${value}T00:00:00.000Z`),
        ),
      'Informe uma data de entrada válida.',
    ),

  status: deviceStatusSchema,

  notes: z
    .string()
    .trim()
    .max(
      2000,
      'As observações devem possuir no máximo 2000 caracteres.',
    )
    .nullable()
    .optional(),
});

export const createDeviceSchema = devicePayloadSchema
  .extend({
    status: deviceStatusSchema.default('DISPONIVEL'),
  })
  .superRefine((data, context) => {
    if (data.salePrice < data.purchasePrice) {
      context.addIssue({
        code: 'custom',
        path: ['salePrice'],
        message:
          'O valor de venda não pode ser menor que o valor de compra.',
      });
    }
  });

export const updateDeviceSchema = devicePayloadSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'Informe pelo menos um campo para atualizar.',
  )
  .superRefine((data, context) => {
    if (
      data.purchasePrice !== undefined &&
      data.salePrice !== undefined &&
      data.salePrice < data.purchasePrice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['salePrice'],
        message:
          'O valor de venda não pode ser menor que o valor de compra.',
      });
    }
  });

export const listDevicesQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(120)
    .optional(),

  status: deviceStatusSchema.optional(),
});

export const deviceParamsSchema = z.object({
  id: z
    .string()
    .uuid('O identificador do dispositivo é inválido.'),
});

export type CreateDeviceDTO = z.infer<
  typeof createDeviceSchema
>;

export type UpdateDeviceDTO = z.infer<
  typeof updateDeviceSchema
>;

export type ListDevicesQueryDTO = z.infer<
  typeof listDevicesQuerySchema
>;