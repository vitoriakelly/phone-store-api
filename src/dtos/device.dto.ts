import { z } from 'zod';

export const deviceStatusSchema = z.enum([
  'PENDENTE_INFORMACOES',
  'DISPONIVEL',
  'RESERVADO',
  'VENDIDO',
]);

export const deviceConditionSchema = z.enum([
  'NOVO',
  'SEMINOVO',
  'USADO',
]);

const dateSchema = z
  .string({
    message:
      'Informe a data de entrada.',
  })
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'A data deve estar no formato AAAA-MM-DD.',
  )
  .refine(
    (value) =>
      !Number.isNaN(
        Date.parse(
          `${value}T00:00:00.000Z`,
        ),
      ),
    'Informe uma data válida.',
  );

const optionalColorSchema = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return null;
    }

    return value;
  },
  z
    .string()
    .trim()
    .min(
      2,
      'A cor deve possuir pelo menos 2 caracteres.',
    )
    .max(
      50,
      'A cor deve possuir no máximo 50 caracteres.',
    )
    .nullable()
    .optional(),
);

const optionalImeiSchema = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return null;
    }

    return value;
  },
  z
    .string()
    .trim()
    .regex(
      /^\d{15}$/,
      'O IMEI deve possuir exatamente 15 números.',
    )
    .nullable()
    .optional(),
);

const optionalSalePriceSchema = z.preprocess(
  (value) => {
    if (value === '') {
      return null;
    }

    return value;
  },
  z
    .number({
      message:
        'O valor de venda deve ser um número.',
    })
    .positive(
      'O valor de venda deve ser maior que zero.',
    )
    .nullable()
    .optional(),
);

const optionalBatteryHealthSchema =
  z.preprocess(
    (value) => {
      if (value === '') {
        return null;
      }

      return value;
    },
    z
      .number({
        message:
          'A saúde da bateria deve ser um número.',
      })
      .int(
        'A saúde da bateria deve ser um número inteiro.',
      )
      .min(
        0,
        'A saúde da bateria não pode ser menor que 0%.',
      )
      .max(
        100,
        'A saúde da bateria não pode ser maior que 100%.',
      )
      .nullable()
      .optional(),
  );

const optionalSupplierSchema = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return null;
    }

    return value;
  },
  z
    .string()
    .trim()
    .max(
      160,
      'O fornecedor deve possuir no máximo 160 caracteres.',
    )
    .nullable()
    .optional(),
);

const optionalNotesSchema = z.preprocess(
  (value) => {
    if (
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return null;
    }

    return value;
  },
  z
    .string()
    .trim()
    .max(
      2000,
      'As observações devem possuir no máximo 2000 caracteres.',
    )
    .nullable()
    .optional(),
);

const devicePayloadSchema = z.object({
  brand: z
    .string({
      message:
        'Informe a marca do aparelho.',
    })
    .trim()
    .min(
      2,
      'A marca deve possuir pelo menos 2 caracteres.',
    )
    .max(
      80,
      'A marca deve possuir no máximo 80 caracteres.',
    ),

  model: z
    .string({
      message:
        'Informe o modelo do aparelho.',
    })
    .trim()
    .min(
      2,
      'O modelo deve possuir pelo menos 2 caracteres.',
    )
    .max(
      120,
      'O modelo deve possuir no máximo 120 caracteres.',
    ),

  storage: z
    .string({
      message:
        'Informe o armazenamento.',
    })
    .trim()
    .min(
      1,
      'Informe o armazenamento.',
    )
    .max(
      30,
      'O armazenamento deve possuir no máximo 30 caracteres.',
    ),

  color: optionalColorSchema,
  imei: optionalImeiSchema,

  batteryHealth:
    optionalBatteryHealthSchema,

  condition: deviceConditionSchema,

  purchasePrice: z
    .number({
      message:
        'O valor de compra deve ser um número.',
    })
    .positive(
      'O valor de compra deve ser maior que zero.',
    ),

  salePrice: optionalSalePriceSchema,
  supplier: optionalSupplierSchema,
  entryDate: dateSchema,
  status: deviceStatusSchema,
  notes: optionalNotesSchema,
});

export const createDeviceSchema =
  devicePayloadSchema
    .extend({
      status:
        deviceStatusSchema.default(
          'DISPONIVEL',
        ),
    })
    .superRefine(
      (data, context) => {
        if (
          data.salePrice !== null &&
          data.salePrice !==
            undefined &&
          data.salePrice <
            data.purchasePrice
        ) {
          context.addIssue({
            code: 'custom',
            path: ['salePrice'],
            message:
              'O valor de venda não pode ser menor que o valor de compra.',
          });
        }

        if (
          data.status ===
          'PENDENTE_INFORMACOES'
        ) {
          return;
        }

        if (!data.color) {
          context.addIssue({
            code: 'custom',
            path: ['color'],
            message:
              'Informe a cor antes de disponibilizar o aparelho.',
          });
        }

        if (!data.imei) {
          context.addIssue({
            code: 'custom',
            path: ['imei'],
            message:
              'Informe o IMEI antes de disponibilizar o aparelho.',
          });
        }

        if (
          data.salePrice === null ||
          data.salePrice ===
            undefined
        ) {
          context.addIssue({
            code: 'custom',
            path: ['salePrice'],
            message:
              'Informe o valor de venda antes de disponibilizar o aparelho.',
          });
        }
      },
    );

export const updateDeviceSchema =
  devicePayloadSchema
    .partial()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          'Informe pelo menos um campo para atualizar.',
      },
    )
    .superRefine(
      (data, context) => {
        if (
          data.purchasePrice !==
            undefined &&
          data.salePrice !==
            undefined &&
          data.salePrice !== null &&
          data.salePrice <
            data.purchasePrice
        ) {
          context.addIssue({
            code: 'custom',
            path: ['salePrice'],
            message:
              'O valor de venda não pode ser menor que o valor de compra.',
          });
        }
      },
    );

export const listDevicesQuerySchema =
  z
    .object({
      page: z.coerce
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
        )
        .default(1),

      search: z
        .string()
        .trim()
        .max(
          120,
          'A busca deve possuir no máximo 120 caracteres.',
        )
        .optional(),

      status:
        deviceStatusSchema.optional(),

      startDate:
        dateSchema.optional(),

      endDate:
        dateSchema.optional(),
    })
    .superRefine(
      (data, context) => {
        if (
          data.startDate &&
          data.endDate &&
          data.startDate >
            data.endDate
        ) {
          context.addIssue({
            code: 'custom',
            path: ['endDate'],
            message:
              'A data final não pode ser anterior à data inicial.',
          });
        }
      },
    );

export const deviceParamsSchema =
  z.object({
    id: z
      .string()
      .uuid(
        'O identificador do dispositivo é inválido.',
      ),
  });

export type CreateDeviceDTO =
  z.infer<
    typeof createDeviceSchema
  >;

export type UpdateDeviceDTO =
  z.infer<
    typeof updateDeviceSchema
  >;

export type ListDevicesQueryDTO =
  z.infer<
    typeof listDevicesQuerySchema
  >;