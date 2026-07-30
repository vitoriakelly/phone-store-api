import { z } from 'zod';

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
    startDate: optionalDateFilter,
    endDate: optionalDateFilter,
    imei: optionalTextFilter,
    customerName: optionalTextFilter,
    deviceName: optionalTextFilter,
    sellerId: optionalUuidFilter,
  })
  .refine(isValidPeriod, {
    message:
      'A data inicial não pode ser maior que a data final.',
    path: ['endDate'],
  });

export const devicesReportQuerySchema = z
  .object({
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