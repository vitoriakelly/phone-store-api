import { prisma } from '../config/prisma.js';
import type {
  CreateSaleDTO,
  ListSalesQueryDTO,
} from '../dtos/sale.dto.js';
import { AppError } from '../errors/app-error.js';
import {
  Prisma,
  type Device,
  type SalePayment,
} from '../generated/prisma/client.js';

type SaleWithRelations =
  Prisma.SaleGetPayload<{
    include: {
      tradeInDevice: true;
      payments: true;
    };
  }>;

function convertToCents(
  value: number,
) {
  return Math.round(value * 100);
}

function formatCurrency(
  valueInCents: number,
) {
  return (
    Math.abs(valueInCents) / 100
  ).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function nullableText(
  value: string | null | undefined,
) {
  const normalizedValue =
    value?.trim();

  return normalizedValue || null;
}

function mapTradeInDevice(
  device: Device | null,
) {
  if (!device) {
    return null;
  }

  return {
    id: device.id,
    brand: device.brand,
    model: device.model,
    storage: device.storage,
    color: device.color,
    imei: device.imei,

    batteryHealth:
      device.batteryHealth,

    condition: device.condition,

    purchasePrice: Number(
      device.purchasePrice,
    ),

    salePrice:
      device.salePrice === null
        ? null
        : Number(device.salePrice),

    supplier: device.supplier,

    entryDate: device.entryDate
      .toISOString()
      .slice(0, 10),

    status: device.status,
    notes: device.notes,

    createdAt:
      device.createdAt.toISOString(),

    updatedAt:
      device.updatedAt.toISOString(),
  };
}

function mapPayment(
  payment: SalePayment,
) {
  return {
    id: payment.id,
    saleId: payment.saleId,
    method: payment.method,
    amount: Number(payment.amount),

    installments:
      payment.installments,

    createdAt:
      payment.createdAt.toISOString(),

    updatedAt:
      payment.updatedAt.toISOString(),
  };
}

function mapSale(
  sale: SaleWithRelations,
) {
  return {
    id: sale.id,
    deviceId: sale.deviceId,

    tradeInDeviceId:
      sale.tradeInDeviceId,

    deviceBrand: sale.deviceBrand,
    deviceModel: sale.deviceModel,
    deviceImei: sale.deviceImei,

    purchasePrice: Number(
      sale.purchasePrice,
    ),

    salePrice: Number(
      sale.salePrice,
    ),

    customerName: sale.customerName,

    customerPhone:
      sale.customerPhone,

    customerZipCode:
      sale.customerZipCode,

    customerStreet:
      sale.customerStreet,

    customerNeighborhood:
      sale.customerNeighborhood,

    customerCity:
      sale.customerCity,

    customerAddressNumber:
      sale.customerAddressNumber,

    customerSocialNetwork:
      sale.customerSocialNetwork,

    /*
     * Campo legado mantido temporariamente.
     * Representa o primeiro pagamento da venda.
     */
    paymentMethod:
      sale.paymentMethod,

    payments:
      sale.payments.map(
        mapPayment,
      ),

    soldAt: sale.soldAt
      .toISOString()
      .slice(0, 10),

    notes: sale.notes,

    tradeInDevice:
      mapTradeInDevice(
        sale.tradeInDevice,
      ),

    createdAt:
      sale.createdAt.toISOString(),

    updatedAt:
      sale.updatedAt.toISOString(),
  };
}

function validatePayments(
  data: CreateSaleDTO,
) {
  if (data.payments.length === 0) {
    throw new AppError(
      'Informe pelo menos uma forma de pagamento.',
      400,
    );
  }

  const salePriceInCents =
    convertToCents(data.salePrice);

  const paymentsTotalInCents =
    data.payments.reduce(
      (total, payment) =>
        total +
        convertToCents(
          payment.amount,
        ),
      0,
    );

  if (
    paymentsTotalInCents !==
    salePriceInCents
  ) {
    const differenceInCents =
      salePriceInCents -
      paymentsTotalInCents;

    if (differenceInCents > 0) {
      throw new AppError(
        `Ainda faltam ${formatCurrency(
          differenceInCents,
        )} para completar o valor da venda.`,
        400,
      );
    }

    throw new AppError(
      `O total dos pagamentos excede o valor da venda em ${formatCurrency(
        differenceInCents,
      )}.`,
      400,
    );
  }

  for (
    const payment of data.payments
  ) {
    if (payment.amount <= 0) {
      throw new AppError(
        'Todos os pagamentos devem possuir valor maior que zero.',
        400,
      );
    }

    const isCreditCard =
      payment.method ===
      'CARTAO_CREDITO';

    if (
      isCreditCard &&
      payment.installments ===
        undefined
    ) {
      throw new AppError(
        'Informe a quantidade de parcelas para pagamentos com cartão de crédito.',
        400,
      );
    }

    if (
      !isCreditCard &&
      payment.installments !==
        undefined
    ) {
      throw new AppError(
        'A quantidade de parcelas somente pode ser informada para cartão de crédito.',
        400,
      );
    }
  }

  const tradePayments =
    data.payments.filter(
      (payment) =>
        payment.method ===
        'TROCA_DISPOSITIVO',
    );

  if (tradePayments.length > 1) {
    throw new AppError(
      'A venda pode possuir somente um pagamento por troca de dispositivo.',
      400,
    );
  }

  const tradePayment =
    tradePayments[0];

  if (
    tradePayment &&
    !data.tradeInDevice
  ) {
    throw new AppError(
      'Informe os dados do dispositivo recebido na troca.',
      400,
    );
  }

  if (
    !tradePayment &&
    data.tradeInDevice
  ) {
    throw new AppError(
      'Os dados do dispositivo recebido somente podem ser enviados quando existir um pagamento por troca.',
      400,
    );
  }

  if (
    tradePayment &&
    data.tradeInDevice
  ) {
    const tradeAmountInCents =
      convertToCents(
        tradePayment.amount,
      );

    const receivedDeviceValueInCents =
      convertToCents(
        data.tradeInDevice
          .purchasePrice,
      );

    if (
      tradeAmountInCents !==
      receivedDeviceValueInCents
    ) {
      throw new AppError(
        'O valor do pagamento por troca deve ser igual ao valor de compra do dispositivo recebido.',
        400,
      );
    }
  }

  const primaryPayment =
    data.payments[0];

  if (!primaryPayment) {
    throw new AppError(
      'Informe pelo menos uma forma de pagamento.',
      400,
    );
  }

  return {
    primaryPaymentMethod:
      primaryPayment.method,

    tradePayment:
      tradePayment ?? null,
  };
}

class SaleService {
  async create(
    data: CreateSaleDTO,
  ) {
    const {
      primaryPaymentMethod,
      tradePayment,
    } = validatePayments(data);

    const device =
      await prisma.device.findUnique({
        where: {
          id: data.deviceId,
        },

        include: {
          sale: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!device) {
      throw new AppError(
        'Dispositivo não encontrado.',
        404,
      );
    }

    if (
      device.status ===
      'PENDENTE_INFORMACOES'
    ) {
      throw new AppError(
        'Este dispositivo possui informações pendentes e ainda não pode ser vendido.',
        409,
      );
    }

    if (
      device.status === 'VENDIDO' ||
      device.sale
    ) {
      throw new AppError(
        'Este dispositivo já possui uma venda registrada.',
        409,
      );
    }

    if (
      device.status !== 'DISPONIVEL' &&
      device.status !== 'RESERVADO'
    ) {
      throw new AppError(
        'Este dispositivo não está disponível para venda.',
        409,
      );
    }

    if (!device.imei) {
      throw new AppError(
        'Informe o IMEI do dispositivo antes de registrar a venda.',
        400,
      );
    }

    const soldDeviceImei =
      device.imei;

    const isTradeIn =
      tradePayment !== null;

    try {
      return await prisma.$transaction(
        async (transaction) => {
          /*
           * Executamos novamente as validações
           * financeiras dentro da transação.
           */
          validatePayments(data);

          let tradeInDeviceId:
            | string
            | null = null;

          if (
            isTradeIn &&
            data.tradeInDevice
          ) {
            const tradeInData =
              data.tradeInDevice;

            if (tradeInData.imei) {
              const deviceWithSameImei =
                await transaction.device.findUnique(
                  {
                    where: {
                      imei:
                        tradeInData.imei,
                    },

                    select: {
                      id: true,
                    },
                  },
                );

              if (
                deviceWithSameImei
              ) {
                throw new AppError(
                  'Já existe um dispositivo cadastrado com o IMEI informado na troca.',
                  409,
                );
              }
            }

            const receivedDevice =
              await transaction.device.create(
                {
                  data: {
                    brand:
                      tradeInData.brand,

                    model:
                      tradeInData.model,

                    storage:
                      tradeInData.storage,

                    color:
                      tradeInData.color ??
                      null,

                    imei:
                      tradeInData.imei ??
                      null,

                    batteryHealth:
                      tradeInData
                        .batteryHealth,

                    condition:
                      tradeInData
                        .condition,

                    purchasePrice:
                      tradeInData
                        .purchasePrice,

                    salePrice:
                      tradeInData
                        .salePrice ??
                      null,

                    /*
                     * O fornecedor do aparelho
                     * recebido é o comprador.
                     */
                    supplier:
                      data.customerName,

                    entryDate: new Date(
                      `${tradeInData.entryDate}T00:00:00.000Z`,
                    ),

                    status:
                      'PENDENTE_INFORMACOES',

                    notes:
                      nullableText(
                        tradeInData.notes,
                      ),
                  },

                  select: {
                    id: true,
                  },
                },
              );

            tradeInDeviceId =
              receivedDevice.id;
          }

          const sale =
            await transaction.sale.create(
              {
                data: {
                  deviceId:
                    device.id,

                  tradeInDeviceId,

                  deviceBrand:
                    device.brand,

                  deviceModel:
                    device.model,

                  deviceImei:
                    soldDeviceImei,

                  purchasePrice:
                    device.purchasePrice,

                  salePrice:
                    data.salePrice,

                  customerName:
                    data.customerName,

                  customerPhone:
                    nullableText(
                      data.customerPhone,
                    ),

                  customerZipCode:
                    nullableText(
                      data.customerZipCode,
                    ),

                  customerStreet:
                    nullableText(
                      data.customerStreet,
                    ),

                  customerNeighborhood:
                    nullableText(
                      data.customerNeighborhood,
                    ),

                  customerCity:
                    nullableText(
                      data.customerCity,
                    ),

                  customerAddressNumber:
                    nullableText(
                      data.customerAddressNumber,
                    ),

                  customerSocialNetwork:
                    nullableText(
                      data.customerSocialNetwork,
                    ),

                  /*
                   * Campo legado.
                   * Recebe o primeiro método.
                   */
                  paymentMethod:
                    primaryPaymentMethod,

                  soldAt: new Date(
                    `${data.soldAt}T00:00:00.000Z`,
                  ),

                  notes:
                    nullableText(
                      data.notes,
                    ),

                  payments: {
                    create:
                      data.payments.map(
                        (payment) => ({
                          method:
                            payment.method,

                          amount:
                            payment.amount,

                          installments:
                            payment.method ===
                            'CARTAO_CREDITO'
                              ? payment.installments
                              : null,
                        }),
                      ),
                  },
                },

                include: {
                  tradeInDevice: true,

                  payments: {
                    orderBy: [
                      {
                        createdAt:
                          'asc',
                      },
                      {
                        id: 'asc',
                      },
                    ],
                  },
                },
              },
            );

          await transaction.device.update(
            {
              where: {
                id: device.id,
              },

              data: {
                status: 'VENDIDO',
              },
            },
          );

          return mapSale(sale);
        },
      );
    } catch (error) {
      if (
        error instanceof AppError
      ) {
        throw error;
      }

      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target =
          Array.isArray(
            error.meta?.target,
          )
            ? error.meta.target.join(
                ',',
              )
            : String(
                error.meta?.target ??
                  '',
              );

        if (
          target.includes('imei')
        ) {
          throw new AppError(
            'Já existe um dispositivo cadastrado com o IMEI informado.',
            409,
          );
        }

        throw new AppError(
          'Este dispositivo já possui uma venda registrada.',
          409,
        );
      }

      throw error;
    }
  }

  async list(
    query: ListSalesQueryDTO,
  ) {
    const where:
      Prisma.SaleWhereInput = {};

    if (query.paymentMethod) {
      where.payments = {
        some: {
          method:
            query.paymentMethod,
        },
      };
    }

    if (query.search) {
      where.OR = [
        {
          customerName: {
            contains:
              query.search,
            mode: 'insensitive',
          },
        },
        {
          customerPhone: {
            contains:
              query.search,
            mode: 'insensitive',
          },
        },
        {
          customerSocialNetwork: {
            contains:
              query.search,
            mode: 'insensitive',
          },
        },
        {
          customerCity: {
            contains:
              query.search,
            mode: 'insensitive',
          },
        },
        {
          deviceBrand: {
            contains:
              query.search,
            mode: 'insensitive',
          },
        },
        {
          deviceModel: {
            contains:
              query.search,
            mode: 'insensitive',
          },
        },
        {
          deviceImei: {
            contains:
              query.search,
          },
        },
      ];
    }

    const sales =
      await prisma.sale.findMany({
        where,

        include: {
          tradeInDevice: true,

          payments: {
            orderBy: [
              {
                createdAt: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          },
        },

        orderBy: [
          {
            soldAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    const mappedSales =
      sales.map(mapSale);

    const totalRevenue =
      mappedSales.reduce(
        (total, sale) =>
          total +
          sale.salePrice,
        0,
      );

    const totalProfit =
      mappedSales.reduce(
        (total, sale) =>
          total +
          (sale.salePrice -
            sale.purchasePrice),
        0,
      );

    return {
      data: mappedSales,

      meta: {
        total:
          mappedSales.length,

        totalRevenue,

        totalProfit,
      },
    };
  }

  async findById(
    saleId: string,
  ) {
    const sale =
      await prisma.sale.findUnique({
        where: {
          id: saleId,
        },

        include: {
          tradeInDevice: true,

          payments: {
            orderBy: [
              {
                createdAt: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          },
        },
      });

    if (!sale) {
      throw new AppError(
        'Venda não encontrada.',
        404,
      );
    }

    return mapSale(sale);
  }
}

export const saleService =
  new SaleService();