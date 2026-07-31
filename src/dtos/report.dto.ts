import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'PIX',
  'DINHEIRO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'TRANSFERENCIA',
  'TROCA_DISPOSITIVO',
  'OUTRO',
]);

const optionalTextFilter = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return value;
  });

const optionalDateFilter = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'A data deve estar no formato YYYY-MM-DD.',
  )
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return value;
  });

const optionalUuidFilter = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return undefined;
    }

    return value;
  },
  z
    .string()
    .uuid(
      'O identificador do vendedor é inválido.',
    )
    .optional(),
);

const pageSchema = z.preprocess(
  (value) => {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return 1;
    }

    return Number(value);
  },
  z
    .number({
      message:
        'A página deve ser um número.',
    })
    .int(
      'A página deve ser um número inteiro.',
    )
    .min(
      1,
      'A página deve ser maior ou igual a 1.',
    ),
);

function isValidPeriod(data: {
  startDate?: string;
  endDate?: string;
}) {
  if (!data.startDate || !data.endDate) {
    return true;
  }

  return data.startDate <= data.endDate;
}

export const salesReportQuerySchema = z
  .object({
    page: pageSchema,
    startDate: optionalDateFilter,
    endDate: optionalDateFilter,
    imei: optionalTextFilter,
    customerName: optionalTextFilter,
    deviceName: optionalTextFilter,
    sellerId: optionalUuidFilter,
    paymentMethod:
      paymentMethodSchema.optional(),
  })
  .refine(isValidPeriod, {
    message:
      'A data inicial não pode ser maior que a data final.',
    path: ['endDate'],
  });

export const devicesReportQuerySchema = z
  .object({
    page: pageSchema,
    startDate: optionalDateFilter,
    endDate: optionalDateFilter,
    imei: optionalTextFilter,
    supplier: optionalTextFilter,
    deviceName: optionalTextFilter,
    status: z
      .enum([
        'PENDENTE_INFORMACOES',
        'DISPONIVEL',
        'RESERVADO',
        'VENDIDO',
      ])
      .optional(),
  })
  .refine(isValidPeriod, {
    message:
      'A data inicial não pode ser maior que a data final.',
    path: ['endDate'],
  });

export const commissionsReportQuerySchema =
  z
    .object({
      page: pageSchema,
      startDate: optionalDateFilter,
      endDate: optionalDateFilter,
      sellerId: optionalUuidFilter,
    })
    .refine(isValidPeriod, {
      message:
        'A data inicial não pode ser maior que a data final.',
      path: ['endDate'],
    });

export type SalesReportQuery =
  z.infer<typeof salesReportQuerySchema>;

export type DevicesReportQuery =
  z.infer<typeof devicesReportQuerySchema>;

export type CommissionsReportQuery =
  z.infer<
    typeof commissionsReportQuerySchema
  >;