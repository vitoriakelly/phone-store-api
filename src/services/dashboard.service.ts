import { prisma } from '../config/prisma.js';
import type { DashboardQueryDTO } from '../dtos/dashboard.dto.js';
import {
  DeviceStatus,
  Prisma,
} from '../generated/prisma/client.js';

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

class DashboardService {
  async getDashboard(
    filters: DashboardQueryDTO,
  ) {
    const salesWhere:
      Prisma.SaleWhereInput = {};

    if (
      filters.startDate ||
      filters.endDate
    ) {
      salesWhere.soldAt = {
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

    const [
      devicesByStatus,
      inventoryAggregate,
      recentDevices,
      salesAggregate,
      recentSales,
    ] = await Promise.all([
      prisma.device.groupBy({
        by: ['status'],

        _count: {
          _all: true,
        },
      }),

      prisma.device.aggregate({
        where: {
          status: {
            not: DeviceStatus.VENDIDO,
          },
        },

        _sum: {
          salePrice: true,
        },
      }),

      prisma.device.findMany({
        take: 5,

        select: {
          id: true,
          brand: true,
          model: true,
          storage: true,
          color: true,
          condition: true,
          salePrice: true,
          entryDate: true,
          status: true,
          createdAt: true,
        },

        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            entryDate: 'desc',
          },
        ],
      }),

      prisma.sale.aggregate({
        where: salesWhere,

        _count: {
          _all: true,
        },

        _sum: {
          salePrice: true,
          purchasePrice: true,
          commissionAmount: true,
        },
      }),

      prisma.sale.findMany({
        where: salesWhere,
        take: 5,

        select: {
          id: true,
          sellerName: true,
          deviceBrand: true,
          deviceModel: true,
          customerName: true,
          salePrice: true,
          purchasePrice: true,
          commissionAmount: true,
          paymentMethod: true,
          soldAt: true,
          createdAt: true,
          updatedAt: true,

          payments: {
            select: {
              id: true,
              saleId: true,
              method: true,
              amount: true,
              installments: true,
              createdAt: true,
              updatedAt: true,
            },

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
    ]);

    const statusCounts = {
      pending: 0,
      available: 0,
      reserved: 0,
      sold: 0,
    };

    for (
      const item of devicesByStatus
    ) {
      if (
        item.status ===
        DeviceStatus.PENDENTE_INFORMACOES
      ) {
        statusCounts.pending =
          item._count._all;
      }

      if (
        item.status ===
        DeviceStatus.DISPONIVEL
      ) {
        statusCounts.available =
          item._count._all;
      }

      if (
        item.status ===
        DeviceStatus.RESERVADO
      ) {
        statusCounts.reserved =
          item._count._all;
      }

      if (
        item.status ===
        DeviceStatus.VENDIDO
      ) {
        statusCounts.sold =
          item._count._all;
      }
    }

    const totalDevices =
      statusCounts.pending +
      statusCounts.available +
      statusCounts.reserved +
      statusCounts.sold;

    const totalRevenue = Number(
      salesAggregate._sum
        .salePrice ?? 0,
    );

    const totalCost = Number(
      salesAggregate._sum
        .purchasePrice ?? 0,
    );

    const totalCommission = Number(
      salesAggregate._sum
        .commissionAmount ?? 0,
    );

    const totalProfit =
      totalRevenue - totalCost;

    const totalProfitAfterCommission =
      totalProfit -
      totalCommission;

    const totalSales =
      salesAggregate._count._all;

    return {
      stock: {
        total: totalDevices,

        pending:
          statusCounts.pending,

        available:
          statusCounts.available,

        reserved:
          statusCounts.reserved,

        sold: statusCounts.sold,

        inventoryValue:
          roundCurrency(
            Number(
              inventoryAggregate._sum
                .salePrice ?? 0,
            ),
          ),
      },

      sales: {
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

        totalSales,

        averageTicket:
          roundCurrency(
            totalSales > 0
              ? totalRevenue /
                  totalSales
              : 0,
          ),
      },

      recentDevices:
        recentDevices.map(
          (device) => ({
            ...device,

            salePrice:
              device.salePrice === null
                ? null
                : Number(
                    device.salePrice,
                  ),

            entryDate:
              device.entryDate
                .toISOString()
                .slice(0, 10),

            createdAt:
              device.createdAt
                .toISOString(),
          }),
        ),

      recentSales:
        recentSales.map(
          (sale) => ({
            ...sale,

            salePrice: Number(
              sale.salePrice,
            ),

            purchasePrice: Number(
              sale.purchasePrice,
            ),

            commissionAmount:
              Number(
                sale.commissionAmount,
              ),

            soldAt:
              sale.soldAt
                .toISOString()
                .slice(0, 10),

            createdAt:
              sale.createdAt
                .toISOString(),

            updatedAt:
              sale.updatedAt
                .toISOString(),

            payments:
              sale.payments.map(
                (payment) => ({
                  ...payment,

                  amount: Number(
                    payment.amount,
                  ),

                  createdAt:
                    payment.createdAt
                      .toISOString(),

                  updatedAt:
                    payment.updatedAt
                      .toISOString(),
                }),
              ),
          }),
        ),

      filters,
    };
  }
}

export const dashboardService =
  new DashboardService();