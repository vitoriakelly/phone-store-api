import { prisma } from '../config/prisma.js';
import type {
  CreateSaleDTO,
  ListSalesQueryDTO,
} from '../dtos/sale.dto.js';
import { AppError } from '../errors/app-error.js';
import {
  Prisma,
  UserRole,
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

const SALES_PAGE_SIZE = 10;

function getStartOfDay(
  date: string,
) {
  return new Date(
    `${date}T00:00:00.000Z`,
  );
}

function getEndOfDay(
  date: string,
) {
  return new Date(
    `${date}T23:59:59.999Z`,
  );
}

function roundCurrency(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
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

    sellerId: sale.sellerId,
    sellerName: sale.sellerName,

    deviceBrand: sale.deviceBrand,
    deviceModel: sale.deviceModel,
    deviceImei: sale.deviceImei,

    deviceCondition:
      sale.deviceCondition,

    purchasePrice: Number(
      sale.purchasePrice,
    ),

    grossSalePrice:
      sale.grossSalePrice === null
        ? Number(sale.salePrice) +
          Number(
            sale.discountAmount,
          )
        : Number(
            sale.grossSalePrice,
          ),

    discountAmount: Number(
      sale.discountAmount,
    ),

    salePrice: Number(
      sale.salePrice,
    ),

    commissionType:
      sale.commissionType,

    commissionValue:
      sale.commissionValue === null
        ? null
        : Number(
            sale.commissionValue,
          ),

    commissionAmount: Number(
      sale.commissionAmount,
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

function calculateSaleFinancials(
  data: CreateSaleDTO,
) {
  const grossSalePriceInCents =
    convertToCents(
      data.salePrice,
    );

  const discountAmountInCents =
    convertToCents(
      data.discountAmount,
    );

  if (discountAmountInCents < 0) {
    throw new AppError(
      'O desconto não pode ser negativo.',
      400,
    );
  }

  if (
    discountAmountInCents >=
    grossSalePriceInCents
  ) {
    throw new AppError(
      'O desconto deve ser menor que o valor da venda.',
      400,
    );
  }

  const finalSalePriceInCents =
    grossSalePriceInCents -
    discountAmountInCents;

  let commissionAmountInCents = 0;

  if (
    data.commissionType &&
    data.commissionValue ===
      undefined
  ) {
    throw new AppError(
      'Informe o percentual ou o valor fixo da comissão.',
      400,
    );
  }

  if (
    !data.commissionType &&
    data.commissionValue !==
      undefined
  ) {
    throw new AppError(
      'Selecione o tipo da comissão.',
      400,
    );
  }

  if (
    data.commissionType &&
    data.commissionValue !==
      undefined
  ) {
    if (
      data.commissionValue <= 0
    ) {
      throw new AppError(
        'O valor da comissão deve ser maior que zero.',
        400,
      );
    }

    if (
      data.commissionType ===
      'PERCENTAGE'
    ) {
      if (
        data.commissionValue > 100
      ) {
        throw new AppError(
          'O percentual da comissão não pode ser maior que 100%.',
          400,
        );
      }

      commissionAmountInCents =
        Math.round(
          finalSalePriceInCents *
            (data.commissionValue /
              100),
        );
    } else {
      commissionAmountInCents =
        convertToCents(
          data.commissionValue,
        );

      if (
        commissionAmountInCents >
        finalSalePriceInCents
      ) {
        throw new AppError(
          'A comissão fixa não pode ser maior que o valor final da venda.',
          400,
        );
      }
    }
  }

  return {
    grossSalePrice:
      grossSalePriceInCents / 100,

    discountAmount:
      discountAmountInCents / 100,

    finalSalePrice:
      finalSalePriceInCents / 100,

    commissionType:
      data.commissionType ??
      null,

    commissionValue:
      data.commissionValue ??
      null,

    commissionAmount:
      commissionAmountInCents /
      100,
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

  const financials =
    calculateSaleFinancials(data);

  const finalSalePriceInCents =
    convertToCents(
      financials.finalSalePrice,
    );

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
    finalSalePriceInCents
  ) {
    const differenceInCents =
      finalSalePriceInCents -
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

    financials,
  };
}

class SaleService {
  async create(
    data: CreateSaleDTO,
  ) {
    const {
      primaryPaymentMethod,
      tradePayment,
      financials,
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
           * As validações financeiras são
           * executadas novamente dentro
           * da transação.
           */
          validatePayments(data);

          const seller =
            await transaction.user.findFirst({
              where: {
                id: data.sellerId,
                active: true,

                role: {
                  in: [
                    UserRole.MASTER,
                    UserRole.FUNCIONARIO,
                  ],
                },
              },

              select: {
                id: true,
                name: true,
              },
            });

          if (!seller) {
            throw new AppError(
              'O vendedor selecionado não existe ou está desativado.',
              400,
            );
          }

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

                  sellerId:
                    seller.id,

                  /*
                   * Nome salvo como histórico.
                   */
                  sellerName:
                    seller.name,

                  deviceBrand:
                    device.brand,

                  deviceModel:
                    device.model,

                  deviceImei:
                    soldDeviceImei,

                  /*
                   * Condição salva como histórico
                   * no momento da venda.
                   */
                  deviceCondition:
                    device.condition,

                  purchasePrice:
                    device.purchasePrice,

                  /*
                   * O valor informado no formulário
                   * antes da aplicação do desconto.
                   */
                  grossSalePrice:
                    financials
                      .grossSalePrice,

                  discountAmount:
                    financials
                      .discountAmount,

                  /*
                   * salePrice permanece como o valor
                   * líquido efetivamente pago.
                   */
                  salePrice:
                    financials
                      .finalSalePrice,

                  commissionType:
                    financials
                      .commissionType,

                  commissionValue:
                    financials
                      .commissionValue,

                  commissionAmount:
                    financials
                      .commissionAmount,

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

    if (query.sellerId) {
      where.sellerId =
        query.sellerId;
    }

    if (query.deviceCondition) {
      where.deviceCondition =
        query.deviceCondition;
    }

    if (
      query.startDate ||
      query.endDate
    ) {
      where.soldAt = {
        ...(query.startDate
          ? {
              gte: getStartOfDay(
                query.startDate,
              ),
            }
          : {}),

        ...(query.endDate
          ? {
              lte: getEndOfDay(
                query.endDate,
              ),
            }
          : {}),
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
          sellerName: {
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

    const skip =
      (query.page - 1) *
      SALES_PAGE_SIZE;

    const [
      sales,
      total,
      aggregate,
    ] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: SALES_PAGE_SIZE,

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
      }),

      /*
       * Total de registros encontrados
       * considerando todos os filtros.
       */
      prisma.sale.count({
        where,
      }),

      /*
       * Os cards financeiros consideram
       * todos os registros filtrados, e não
       * somente os 10 itens da página.
       */
      prisma.sale.aggregate({
        where,

        _sum: {
          salePrice: true,
          purchasePrice: true,
          commissionAmount: true,
        },
      }),
    ]);

    const totalRevenue =
      Number(
        aggregate._sum
          .salePrice ?? 0,
      );

    const totalCost =
      Number(
        aggregate._sum
          .purchasePrice ?? 0,
      );

    const totalCommission =
      Number(
        aggregate._sum
          .commissionAmount ?? 0,
      );

    const totalProfit =
      totalRevenue -
      totalCost;

    const totalProfitAfterCommission =
      totalProfit -
      totalCommission;

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total /
              SALES_PAGE_SIZE,
          );

    return {
      data: sales.map(mapSale),

      meta: {
        page: query.page,
        pageSize:
          SALES_PAGE_SIZE,
        total,
        totalPages,

        hasPreviousPage:
          query.page > 1,

        hasNextPage:
          query.page <
          totalPages,

        totalRevenue:
          roundCurrency(
            totalRevenue,
          ),

        totalProfit:
          roundCurrency(
            totalProfit,
          ),

        totalCommission:
          roundCurrency(
            totalCommission,
          ),

        totalProfitAfterCommission:
          roundCurrency(
            totalProfitAfterCommission,
          ),

        averageTicket:
          roundCurrency(
            total > 0
              ? totalRevenue / total
              : 0,
          ),
      },

      filters: query,
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