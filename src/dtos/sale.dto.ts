import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'PIX',
  'DINHEIRO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'TRANSFERENCIA',
  'OUTRO',
]);

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'A data deve estar no formato AAAA-MM-DD.',
  )
  .refine(
    (value) =>
      !Number.isNaN(
        Date.parse(`${value}T00:00:00.000Z`),
      ),
    'Informe uma data válida.',
  );

export const createSaleSchema = z.object({
  deviceId: z
    .string()
    .uuid('O identificador do dispositivo é inválido.'),

  customerName: z
    .string()
    .trim()
    .min(3, 'Informe o nome do cliente.')
    .max(
      160,
      'O nome deve possuir no máximo 160 caracteres.',
    ),

  customerPhone: z
    .string()
    .trim()
    .max(
      30,
      'O telefone deve possuir no máximo 30 caracteres.',
    )
    .nullable()
    .optional(),

  salePrice: z
    .number()
    .positive(
      'O valor da venda deve ser maior que zero.',
    ),

  paymentMethod: paymentMethodSchema,

  soldAt: dateSchema,

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

export const listSalesQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(
      160,
      'A pesquisa deve possuir no máximo 160 caracteres.',
    )
    .optional(),

  paymentMethod: paymentMethodSchema.optional(),
});

export const saleParamsSchema = z.object({
  id: z
    .string()
    .uuid('O identificador da venda é inválido.'),
});

export type CreateSaleDTO = z.infer<
  typeof createSaleSchema
>;

export type ListSalesQueryDTO = z.infer<
  typeof listSalesQuerySchema
>;