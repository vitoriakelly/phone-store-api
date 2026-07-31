import { prisma } from '../config/prisma.js';
import type {
  CommissionsReportQuery,
  DevicesReportQuery,
  SalesReportQuery,
} from '../dtos/report.dto.js';
import {
  DeviceStatus,
  Prisma,
} from '../generated/prisma/client.js';

const PAGE_SIZE = 10;

function getStartOfDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function getEndOfDay(date: string) {
  return new Date(`${date}T23:59:59.999Z`);
}

function roundCurrency(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function buildPagination(
  page: number,
  total: number,
) {
  const totalPages =
    total === 0
      ? 0
      : Math.ceil(total / PAGE_SIZE);

  return {
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage:
      totalPages > 0 &&
      page < totalPages,
  };
}

function buildSaleDateFilter(
  startDate?: string,
  endDate?: string,
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    ...(startDate
      ? {
          gte: getStartOfDay(startDate),
        }
      : {}),

    ...(endDate
      ? {
          lte: getEndOfDay(endDate),
        }
      : {}),
  };
}

function buildSalesWhere(
  filters: SalesReportQuery,
) {
  const where:
    Prisma.SaleWhereInput = {};

  const soldAtFilter =
    buildSaleDateFilter(
      filters.startDate,
      filters.endDate,
    );

  if (soldAtFilter) {
    where.soldAt = soldAtFilter;
  }

  if (filters.sellerId) {
    where.sellerId =
      filters.sellerId;
  }

  if (filters.paymentMethod) {
    where.payments = {
      some: {
        method:
          filters.paymentMethod,
      },
    };
  }

  if (filters.imei) {
    where.deviceImei = {
      contains: filters.imei,
      mode: 'insensitive',
    };
  }

  if (filters.customerName) {
    where.customerName = {
      contains:
        filters.customerName,
      mode: 'insensitive',
    };
  }

  if (filters.deviceName) {
    where.OR = [
      {
        deviceBrand: {
          contains:
            filters.deviceName,
          mode: 'insensitive',
        },
      },
      {
        deviceModel: {
          contains:
            filters.deviceName,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

function buildDevicesWhere(
  filters: DevicesReportQuery,
) {
  const where:
    Prisma.DeviceWhereInput = {};

  if (
    filters.startDate ||
    filters.endDate
  ) {
    where.entryDate = {
      ...(filters.startDate
        ? {
            gte: getStartOfDay(
              filters.startDate,
            ),
          }
        : {}),

      ...(filters.endDate
        ? {
            lte: getEndOfDay(
              filters.endDate,
            ),
          }
        : {}),
    };
  }

  if (filters.imei) {
    where.imei = {
      contains: filters.imei,
      mode: 'insensitive',
    };
  }

  if (filters.supplier) {
    where.supplier = {
      contains:
        filters.supplier,
      mode: 'insensitive',
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.deviceName) {
    where.OR = [
      {
        brand: {
          contains:
            filters.deviceName,
          mode: 'insensitive',
        },
      },
      {
        model: {
          contains:
            filters.deviceName,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

function buildCommissionsWhere(
  filters: CommissionsReportQuery,
) {
  const where:
    Prisma.SaleWhereInput = {};

  const soldAtFilter =
    buildSaleDateFilter(
      filters.startDate,
      filters.endDate,
    );

  if (soldAtFilter) {
    where.soldAt = soldAtFilter;
  }

  if (filters.sellerId) {
    where.sellerId =
      filters.sellerId;
  }

  return where;
}

function getSaleGrossTotal(
  aggregate: {
    _sum: {
      grossSalePrice:
        | Prisma.Decimal
        | null;
    };
  },
  legacyAggregate: {
    _sum: {
      salePrice:
        | Prisma.Decimal
        | null;
      discountAmount:
        | Prisma.Decimal
        | null;
    };
  },
) {
  return (
    Number(
      aggregate._sum
        .grossSalePrice ?? 0,
    ) +
    Number(
      legacyAggregate._sum
        .salePrice ?? 0,
    ) +
    Number(
      legacyAggregate._sum
        .discountAmount ?? 0,
    )
  );
}

type SaleWithRelations =
  Prisma.SaleGetPayload<{
    include: {
      payments: true;
      tradeInDevice: true;
    };
  }>;

type DeviceRecord =
  Prisma.DeviceGetPayload<object>;

function mapSale(
  sale: SaleWithRelations,
) {
  const grossSalePrice =
    sale.grossSalePrice === null
      ? Number(sale.salePrice) +
        Number(
          sale.discountAmount,
        )
      : Number(
          sale.grossSalePrice,
        );

  const salePrice =
    Number(sale.salePrice);

  const purchasePrice =
    Number(sale.purchasePrice);

  const commissionAmount =
    Number(
      sale.commissionAmount,
    );

  return {
    ...sale,

    grossSalePrice:
      roundCurrency(
        grossSalePrice,
      ),

    discountAmount:
      roundCurrency(
        Number(
          sale.discountAmount,
        ),
      ),

    salePrice:
      roundCurrency(
        salePrice,
      ),

    purchasePrice:
      roundCurrency(
        purchasePrice,
      ),

    commissionValue:
      sale.commissionValue === null
        ? null
        : Number(
            sale.commissionValue,
          ),

    commissionAmount:
      roundCurrency(
        commissionAmount,
      ),

    profitBeforeCommission:
      roundCurrency(
        salePrice -
          purchasePrice,
      ),

    profitAfterCommission:
      roundCurrency(
        salePrice -
          purchasePrice -
          commissionAmount,
      ),

    soldAt:
      sale.soldAt
        .toISOString()
        .slice(0, 10),

    createdAt:
      sale.createdAt.toISOString(),

    updatedAt:
      sale.updatedAt.toISOString(),

    payments:
      sale.payments.map(
        (payment) => ({
          ...payment,

          amount:
            roundCurrency(
              Number(
                payment.amount,
              ),
            ),

          createdAt:
            payment.createdAt
              .toISOString(),

          updatedAt:
            payment.updatedAt
              .toISOString(),
        }),
      ),

    tradeInDevice:
      sale.tradeInDevice
        ? {
            ...sale.tradeInDevice,

            purchasePrice:
              roundCurrency(
                Number(
                  sale
                    .tradeInDevice
                    .purchasePrice,
                ),
              ),

            salePrice:
              sale.tradeInDevice
                .salePrice === null
                ? null
                : roundCurrency(
                    Number(
                      sale
                        .tradeInDevice
                        .salePrice,
                    ),
                  ),

            entryDate:
              sale.tradeInDevice
                .entryDate
                .toISOString()
                .slice(0, 10),

            createdAt:
              sale.tradeInDevice
                .createdAt
                .toISOString(),

            updatedAt:
              sale.tradeInDevice
                .updatedAt
                .toISOString(),
          }
        : null,
  };
}

function mapDevice(
  device: DeviceRecord,
) {
  return {
    ...device,

    purchasePrice:
      roundCurrency(
        Number(
          device.purchasePrice,
        ),
      ),

    salePrice:
      device.salePrice === null
        ? null
        : roundCurrency(
            Number(
              device.salePrice,
            ),
          ),

    entryDate:
      device.entryDate
        .toISOString()
        .slice(0, 10),

    createdAt:
      device.createdAt.toISOString(),

    updatedAt:
      device.updatedAt.toISOString(),
  };
}

export class ReportService {
  async getSalesReport(
    filters: SalesReportQuery,
  ) {
    const where =
      buildSalesWhere(filters);

    const skip =
      (filters.page - 1) *
      PAGE_SIZE;

    const legacyWhere:
      Prisma.SaleWhereInput = {
        AND: [
          where,
          {
            grossSalePrice: null,
          },
        ],
      };

    const [
      sales,
      total,
      aggregate,
      legacyAggregate,
    ] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: PAGE_SIZE,

        include: {
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

          tradeInDevice: true,
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

      prisma.sale.count({
        where,
      }),

      prisma.sale.aggregate({
        where,

        _sum: {
          grossSalePrice: true,
          discountAmount: true,
          salePrice: true,
          purchasePrice: true,
          commissionAmount: true,
        },
      }),

      prisma.sale.aggregate({
        where: legacyWhere,

        _sum: {
          salePrice: true,
          discountAmount: true,
        },
      }),
    ]);

    const totalGrossRevenue =
      getSaleGrossTotal(
        aggregate,
        legacyAggregate,
      );

    const totalDiscount =
      Number(
        aggregate._sum
          .discountAmount ?? 0,
      );

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
      totalRevenue - totalCost;

    return {
      data:
        sales.map(mapSale),

      meta: {
        ...buildPagination(
          filters.page,
          total,
        ),

        totalGrossRevenue:
          roundCurrency(
            totalGrossRevenue,
          ),

        totalDiscount:
          roundCurrency(
            totalDiscount,
          ),

        totalRevenue:
          roundCurrency(
            totalRevenue,
          ),

        totalCost:
          roundCurrency(
            totalCost,
          ),

        totalCommission:
          roundCurrency(
            totalCommission,
          ),

        totalProfit:
          roundCurrency(
            totalProfit,
          ),

        totalProfitAfterCommission:
          roundCurrency(
            totalProfit -
              totalCommission,
          ),

        averageTicket:
          roundCurrency(
            total > 0
              ? totalRevenue / total
              : 0,
          ),
      },

      filters,
    };
  }

  async getDevicesReport(
    filters: DevicesReportQuery,
  ) {
    /*
     * `where` é usado na tabela paginada e
     * nos indicadores relacionados ao período.
     *
     * Os indicadores gerais de estoque são
     * consultados separadamente e não recebem
     * nenhum filtro.
     */
    const where =
      buildDevicesWhere(filters);

    const skip =
      (filters.page - 1) *
      PAGE_SIZE;

    const [
      devices,
      totalFiltered,
      globalStatusGroups,
      soldInFilteredPeriod,
      filteredAggregate,
    ] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take: PAGE_SIZE,

        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      }),

      /*
       * Total usado exclusivamente pela
       * paginação da tabela filtrada.
       */
      prisma.device.count({
        where,
      }),

      /*
       * Totais gerais do estoque.
       * Não recebem filtros de data, status,
       * fornecedor, IMEI ou dispositivo.
       */
      prisma.device.groupBy({
        by: ['status'],

        _count: {
          _all: true,
        },
      }),

      /*
       * Quantidade de vendidos dentro dos
       * filtros informados, incluindo período.
       */
      prisma.device.count({
        where: {
          AND: [
            where,
            {
              status:
                DeviceStatus.VENDIDO,
            },
          ],
        },
      }),

      /*
       * Valores referentes aos filtros e ao
       * período informado pelo usuário.
       */
      prisma.device.aggregate({
        where,

        _sum: {
          purchasePrice: true,
          salePrice: true,
        },
      }),
    ]);

    const globalStatusCounts = {
      pending: 0,
      available: 0,
      reserved: 0,
      sold: 0,
    };

    for (
      const group of
      globalStatusGroups
    ) {
      if (
        group.status ===
        DeviceStatus.PENDENTE_INFORMACOES
      ) {
        globalStatusCounts.pending =
          group._count._all;
      }

      if (
        group.status ===
        DeviceStatus.DISPONIVEL
      ) {
        globalStatusCounts.available =
          group._count._all;
      }

      if (
        group.status ===
        DeviceStatus.RESERVADO
      ) {
        globalStatusCounts.reserved =
          group._count._all;
      }

      if (
        group.status ===
        DeviceStatus.VENDIDO
      ) {
        globalStatusCounts.sold =
          group._count._all;
      }
    }

    const totalDevices =
      globalStatusCounts.pending +
      globalStatusCounts.available +
      globalStatusCounts.reserved +
      globalStatusCounts.sold;

    const totalPurchaseValue =
      Number(
        filteredAggregate._sum
          .purchasePrice ?? 0,
      );

    const totalSaleValue =
      Number(
        filteredAggregate._sum
          .salePrice ?? 0,
      );

    return {
      data:
        devices.map(mapDevice),

      meta: {
        /*
         * Paginação da tabela conforme os
         * filtros aplicados.
         */
        ...buildPagination(
          filters.page,
          totalFiltered,
        ),

        /*
         * Indicadores gerais do sistema.
         * Não mudam ao pesquisar datas.
         */
        totalDevices,

        pending:
          globalStatusCounts.pending,

        available:
          globalStatusCounts.available,

        reserved:
          globalStatusCounts.reserved,

        /*
         * Indicadores do período/filtros.
         */
        sold:
          soldInFilteredPeriod,

        totalPurchaseValue:
          roundCurrency(
            totalPurchaseValue,
          ),

        totalSaleValue:
          roundCurrency(
            totalSaleValue,
          ),

        potentialProfit:
          roundCurrency(
            totalSaleValue -
              totalPurchaseValue,
          ),
      },

      filters,
    };
  }

  async getCommissionsReport(
    filters:
      CommissionsReportQuery,
  ) {
    const where =
      buildCommissionsWhere(
        filters,
      );

    const skip =
      (filters.page - 1) *
      PAGE_SIZE;

    const legacyWhere:
      Prisma.SaleWhereInput = {
        AND: [
          where,
          {
            grossSalePrice: null,
          },
        ],
      };

    const commissionedWhere:
      Prisma.SaleWhereInput = {
        AND: [
          where,
          {
            commissionAmount: {
              gt: 0,
            },
          },
        ],
      };

    const [
      sales,
      total,
      commissionedSales,
      aggregate,
      legacyAggregate,
      sellerGroups,
      legacySellerGroups,
      commissionedSellerGroups,
    ] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: PAGE_SIZE,

        include: {
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

          tradeInDevice: true,
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

      prisma.sale.count({
        where,
      }),

      prisma.sale.count({
        where:
          commissionedWhere,
      }),

      prisma.sale.aggregate({
        where,

        _sum: {
          grossSalePrice: true,
          discountAmount: true,
          salePrice: true,
          purchasePrice: true,
          commissionAmount: true,
        },
      }),

      prisma.sale.aggregate({
        where: legacyWhere,

        _sum: {
          salePrice: true,
          discountAmount: true,
        },
      }),

      prisma.sale.groupBy({
        by: [
          'sellerId',
          'sellerName',
        ],
        where,

        _count: {
          _all: true,
        },

        _sum: {
          grossSalePrice: true,
          discountAmount: true,
          salePrice: true,
          purchasePrice: true,
          commissionAmount: true,
        },
      }),

      prisma.sale.groupBy({
        by: [
          'sellerId',
          'sellerName',
        ],
        where: legacyWhere,

        _sum: {
          salePrice: true,
          discountAmount: true,
        },
      }),

      prisma.sale.groupBy({
        by: [
          'sellerId',
          'sellerName',
        ],
        where:
          commissionedWhere,

        _count: {
          _all: true,
        },
      }),
    ]);

    function sellerKey(
      sellerId: string | null,
      sellerName: string,
    ) {
      return (
        sellerId ??
        `legacy:${sellerName}`
      );
    }

    const legacySellerMap =
      new Map<
        string,
        {
          salePrice: number;
          discountAmount: number;
        }
      >();

    for (
      const group of
      legacySellerGroups
    ) {
      legacySellerMap.set(
        sellerKey(
          group.sellerId,
          group.sellerName,
        ),
        {
          salePrice: Number(
            group._sum
              .salePrice ?? 0,
          ),

          discountAmount:
            Number(
              group._sum
                .discountAmount ??
                0,
            ),
        },
      );
    }

    const commissionedSellerMap =
      new Map<string, number>();

    for (
      const group of
      commissionedSellerGroups
    ) {
      commissionedSellerMap.set(
        sellerKey(
          group.sellerId,
          group.sellerName,
        ),
        group._count._all,
      );
    }

    const sellers =
      sellerGroups
        .map((group) => {
          const key =
            sellerKey(
              group.sellerId,
              group.sellerName,
            );

          const legacy =
            legacySellerMap.get(
              key,
            ) ?? {
              salePrice: 0,
              discountAmount: 0,
            };

          const grossRevenue =
            Number(
              group._sum
                .grossSalePrice ??
                0,
            ) +
            legacy.salePrice +
            legacy.discountAmount;

          const totalDiscount =
            Number(
              group._sum
                .discountAmount ??
                0,
            );

          const netRevenue =
            Number(
              group._sum
                .salePrice ?? 0,
            );

          const totalCost =
            Number(
              group._sum
                .purchasePrice ??
                0,
            );

          const totalCommission =
            Number(
              group._sum
                .commissionAmount ??
                0,
            );

          const totalSales =
            group._count._all;

          const sellerCommissionedSales =
            commissionedSellerMap.get(
              key,
            ) ?? 0;

          const profitBeforeCommission =
            netRevenue -
            totalCost;

          return {
            sellerId:
              group.sellerId,

            sellerName:
              group.sellerName,

            totalSales,

            commissionedSales:
              sellerCommissionedSales,

            grossRevenue:
              roundCurrency(
                grossRevenue,
              ),

            totalDiscount:
              roundCurrency(
                totalDiscount,
              ),

            netRevenue:
              roundCurrency(
                netRevenue,
              ),

            totalCost:
              roundCurrency(
                totalCost,
              ),

            totalCommission:
              roundCurrency(
                totalCommission,
              ),

            profitBeforeCommission:
              roundCurrency(
                profitBeforeCommission,
              ),

            profitAfterCommission:
              roundCurrency(
                profitBeforeCommission -
                  totalCommission,
              ),

            averageTicket:
              roundCurrency(
                totalSales > 0
                  ? netRevenue /
                      totalSales
                  : 0,
              ),

            averageCommission:
              roundCurrency(
                sellerCommissionedSales >
                0
                  ? totalCommission /
                      sellerCommissionedSales
                  : 0,
              ),
          };
        })
        .sort(
          (
            firstSeller,
            secondSeller,
          ) =>
            secondSeller
              .totalCommission -
              firstSeller
                .totalCommission ||
            firstSeller.sellerName
              .localeCompare(
                secondSeller
                  .sellerName,
                'pt-BR',
              ),
        );

    const totalGrossRevenue =
      getSaleGrossTotal(
        aggregate,
        legacyAggregate,
      );

    const totalDiscount =
      Number(
        aggregate._sum
          .discountAmount ?? 0,
      );

    const totalNetRevenue =
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

    const totalProfitBeforeCommission =
      totalNetRevenue -
      totalCost;

    return {
      data:
        sales.map(mapSale),

      sellers,

      meta: {
        ...buildPagination(
          filters.page,
          total,
        ),

        totalSales: total,
        commissionedSales,

        totalSellers:
          sellers.length,

        totalGrossRevenue:
          roundCurrency(
            totalGrossRevenue,
          ),

        totalDiscount:
          roundCurrency(
            totalDiscount,
          ),

        totalNetRevenue:
          roundCurrency(
            totalNetRevenue,
          ),

        totalCost:
          roundCurrency(
            totalCost,
          ),

        totalCommission:
          roundCurrency(
            totalCommission,
          ),

        totalProfitBeforeCommission:
          roundCurrency(
            totalProfitBeforeCommission,
          ),

        totalProfitAfterCommission:
          roundCurrency(
            totalProfitBeforeCommission -
              totalCommission,
          ),

        averageTicket:
          roundCurrency(
            total > 0
              ? totalNetRevenue /
                  total
              : 0,
          ),

        averageCommission:
          roundCurrency(
            commissionedSales > 0
              ? totalCommission /
                  commissionedSales
              : 0,
          ),
      },

      filters,
    };
  }
}

export const reportService =
  new ReportService();