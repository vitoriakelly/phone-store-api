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

const dateSchema = z
  .string({
    message: 'Informe a data.',
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

const optionalTextSchema = (
  maximumLength: number,
  maximumLengthMessage: string,
) =>
  z.preprocess(
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
        maximumLength,
        maximumLengthMessage,
      )
      .nullable()
      .optional(),
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

const optionalSalePriceSchema =
  z.preprocess(
    (value) => {
      if (
        value === '' ||
        value === undefined
      ) {
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

const tradeInDeviceSchema = z
  .object({
    brand: z
      .string({
        message:
          'Informe a marca do dispositivo recebido.',
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
          'Informe o modelo do dispositivo recebido.',
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
          'Informe o armazenamento do dispositivo recebido.',
      })
      .trim()
      .min(
        1,
        'Informe o armazenamento do dispositivo recebido.',
      )
      .max(
        30,
        'O armazenamento deve possuir no máximo 30 caracteres.',
      ),

    color: optionalColorSchema,

    imei: optionalImeiSchema,

    batteryHealth: z
      .number({
        message:
          'Informe a saúde da bateria.',
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
      ),

    condition: z.enum(
      [
        'NOVO',
        'SEMINOVO',
        'USADO',
      ],
      {
        message:
          'Informe a condição do dispositivo recebido.',
      },
    ),

    purchasePrice: z
      .number({
        message:
          'Informe o valor de compra do dispositivo recebido.',
      })
      .positive(
        'O valor de compra deve ser maior que zero.',
      ),

    salePrice:
      optionalSalePriceSchema,

    entryDate: dateSchema,

    notes: optionalTextSchema(
      2000,
      'As observações devem possuir no máximo 2000 caracteres.',
    ),
  })
  .superRefine((data, context) => {
    if (
      data.salePrice !== null &&
      data.salePrice !== undefined &&
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
  });

export const createSaleSchema = z
  .object({
    deviceId: z
      .string()
      .uuid(
        'O identificador do dispositivo é inválido.',
      ),

    customerName: z
      .string({
        message:
          'Informe o nome do cliente.',
      })
      .trim()
      .min(
        3,
        'Informe o nome do cliente.',
      )
      .max(
        160,
        'O nome deve possuir no máximo 160 caracteres.',
      ),

    customerPhone: optionalTextSchema(
      30,
      'O telefone deve possuir no máximo 30 caracteres.',
    ),

    customerZipCode: z
      .string({
        message:
          'Informe o CEP do cliente.',
      })
      .trim()
      .regex(
        /^\d{5}-?\d{3}$/,
        'Informe um CEP válido.',
      ),

    customerStreet: z
      .string({
        message:
          'Informe a rua do cliente.',
      })
      .trim()
      .min(
        2,
        'Informe a rua do cliente.',
      )
      .max(
        180,
        'A rua deve possuir no máximo 180 caracteres.',
      ),

    customerNeighborhood: z
      .string({
        message:
          'Informe o bairro do cliente.',
      })
      .trim()
      .min(
        2,
        'Informe o bairro do cliente.',
      )
      .max(
        120,
        'O bairro deve possuir no máximo 120 caracteres.',
      ),

    customerCity: z
      .string({
        message:
          'Informe a cidade do cliente.',
      })
      .trim()
      .min(
        2,
        'Informe a cidade do cliente.',
      )
      .max(
        120,
        'A cidade deve possuir no máximo 120 caracteres.',
      ),

    customerAddressNumber: z
      .string({
        message:
          'Informe o número do endereço.',
      })
      .trim()
      .min(
        1,
        'Informe o número do endereço.',
      )
      .max(
        30,
        'O número deve possuir no máximo 30 caracteres.',
      ),

    customerSocialNetwork: z
      .string({
        message:
          'Informe uma rede social do cliente.',
      })
      .trim()
      .min(
        2,
        'Informe uma rede social do cliente.',
      )
      .max(
        160,
        'A rede social deve possuir no máximo 160 caracteres.',
      ),

    salePrice: z
      .number({
        message:
          'Informe o valor da venda.',
      })
      .positive(
        'O valor da venda deve ser maior que zero.',
      ),

    paymentMethod:
      paymentMethodSchema,

    soldAt: dateSchema,

    notes: optionalTextSchema(
      2000,
      'As observações devem possuir no máximo 2000 caracteres.',
    ),

    tradeInDevice:
      tradeInDeviceSchema.optional(),
  })
  .superRefine((data, context) => {
    const isTradeIn =
      data.paymentMethod ===
      'TROCA_DISPOSITIVO';

    if (
      isTradeIn &&
      !data.tradeInDevice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['tradeInDevice'],
        message:
          'Informe os dados do dispositivo recebido na troca.',
      });
    }

    if (
      !isTradeIn &&
      data.tradeInDevice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['tradeInDevice'],
        message:
          'O dispositivo recebido somente pode ser informado quando a forma de pagamento for troca de dispositivo.',
      });
    }
  });

export const listSalesQuerySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(
        160,
        'A pesquisa deve possuir no máximo 160 caracteres.',
      )
      .optional(),

    paymentMethod:
      paymentMethodSchema.optional(),
  });

export const saleParamsSchema =
  z.object({
    id: z
      .string()
      .uuid(
        'O identificador da venda é inválido.',
      ),
  });

export type CreateSaleDTO =
  z.infer<
    typeof createSaleSchema
  >;

export type ListSalesQueryDTO =
  z.infer<
    typeof listSalesQuerySchema
  >;