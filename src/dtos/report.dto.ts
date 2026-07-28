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

export const salesReportQuerySchema = z
  .object({
    startDate: optionalDateFilter,
    endDate: optionalDateFilter,
    imei: optionalTextFilter,
    customerName: optionalTextFilter,
    deviceName: optionalTextFilter,
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return data.startDate <= data.endDate;
    },
    {
      message:
        'A data inicial não pode ser maior que a data final.',
      path: ['endDate'],
    },
  );

export const devicesReportQuerySchema = z
  .object({
    startDate: optionalDateFilter,
    endDate: optionalDateFilter,
    imei: optionalTextFilter,
    supplier: optionalTextFilter,
    deviceName: optionalTextFilter,
    status: z
      .enum([
        'DISPONIVEL',
        'RESERVADO',
        'VENDIDO',
      ])
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return data.startDate <= data.endDate;
    },
    {
      message:
        'A data inicial não pode ser maior que a data final.',
      path: ['endDate'],
    },
  );

export type SalesReportQuery =
  z.infer<typeof salesReportQuerySchema>;

export type DevicesReportQuery =
  z.infer<typeof devicesReportQuerySchema>;