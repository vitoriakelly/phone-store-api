import { z } from 'zod';

const optionalDateSchema = z.preprocess(
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
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'A data deve estar no formato YYYY-MM-DD.',
    )
    .optional(),
);

export const dashboardQuerySchema = z
  .object({
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
  })
  .refine(
    (data) => {
      if (
        !data.startDate ||
        !data.endDate
      ) {
        return true;
      }

      return (
        data.startDate <=
        data.endDate
      );
    },
    {
      path: ['endDate'],
      message:
        'A data inicial não pode ser maior que a data final.',
    },
  );

export type DashboardQueryDTO =
  z.infer<
    typeof dashboardQuerySchema
  >;