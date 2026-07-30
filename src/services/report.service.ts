import { prisma } from '../config/prisma.js';
import type {
  CommissionsReportQuery,
  DevicesReportQuery,
  SalesReportQuery,
} from '../dtos/report.dto.js';
import { Prisma } from '../generated/prisma/client.js';

function getStartOfDay(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function getEndOfDay(date: string) {
  return new Date(`${date}T23:59:59.999Z`);
}

function roundCurrency(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

function getGrossSalePrice(sale: {
  grossSalePrice: unknown;
  discountAmount: unknown;
  salePrice: unknown;
}) {
  if (sale.grossSalePrice !== null) {
    return Number(sale.grossSalePrice);
  }

  return (
    Number(sale.salePrice) +
    Number(sale.discountAmount)
  );
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

export class ReportService {
  async getSalesReport(
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

    const sales =
      await prisma.sale.findMany({
        where,

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
      });

    const data = sales.map((sale) => {
      const grossSalePrice =
        getGrossSalePrice(sale);

      const discountAmount =
        Number(sale.discountAmount);

      const netSalePrice =
        Number(sale.salePrice);

      const purchasePrice =
        Number(sale.purchasePrice);

      const commissionValue =
        sale.commissionValue === null
          ? null
          : Number(
              sale.commissionValue,
            );

      const commissionAmount =
        Number(sale.commissionAmount);

      const profitBeforeCommission =
        netSalePrice - purchasePrice;

      const profitAfterCommission =
        profitBeforeCommission -
        commissionAmount;

      return {
        ...sale,

        grossSalePrice:
          roundCurrency(
            grossSalePrice,
          ),

        discountAmount:
          roundCurrency(
            discountAmount,
          ),

        salePrice:
          roundCurrency(
            netSalePrice,
          ),

        purchasePrice:
          roundCurrency(
            purchasePrice,
          ),

        commissionValue,

        commissionAmount:
          roundCurrency(
            commissionAmount,
          ),

        profitBeforeCommission:
          roundCurrency(
            profitBeforeCommission,
          ),

        profitAfterCommission:
          roundCurrency(
            profitAfterCommission,
          ),

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
                    .salePrice ===
                  null
                    ? null
                    : roundCurrency(
                        Number(
                          sale
                            .tradeInDevice
                            .salePrice,
                        ),
                      ),
              }
            : null,
      };
    });

    const totalGrossRevenue =
      data.reduce(
        (total, sale) =>
          total +
          sale.grossSalePrice,
        0,
      );

    const totalDiscount =
      data.reduce(
        (total, sale) =>
          total +
          sale.discountAmount,
        0,
      );

    const totalRevenue =
      data.reduce(
        (total, sale) =>
          total +
          sale.salePrice,
        0,
      );

    const totalCost =
      data.reduce(
        (total, sale) =>
          total +
          sale.purchasePrice,
        0,
      );

    const totalCommission =
      data.reduce(
        (total, sale) =>
          total +
          sale.commissionAmount,
        0,
      );

    const totalProfit =
      totalRevenue - totalCost;

    const totalProfitAfterCommission =
      totalProfit - totalCommission;

    const averageTicket =
      data.length > 0
        ? totalRevenue / data.length
        : 0;

    return {
      data,

      meta: {
        total: data.length,

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
            totalProfitAfterCommission,
          ),

        averageTicket:
          roundCurrency(
            averageTicket,
          ),
      },

      filters,
    };
  }

  async getDevicesReport(
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

    const devices =
      await prisma.device.findMany({
        where,

        orderBy: [
          {
            entryDate: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    const data = devices.map(
      (device) => ({
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
      }),
    );

    const availableDevices =
      data.filter(
        (device) =>
          device.status ===
          'DISPONIVEL',
      ).length;

    const reservedDevices =
      data.filter(
        (device) =>
          device.status ===
          'RESERVADO',
      ).length;

    const soldDevices =
      data.filter(
        (device) =>
          device.status ===
          'VENDIDO',
      ).length;

    const pendingDevices =
      data.filter(
        (device) =>
          device.status ===
          'PENDENTE_INFORMACOES',
      ).length;

    const totalPurchaseValue =
      data.reduce(
        (total, device) =>
          total +
          device.purchasePrice,
        0,
      );

    const totalSaleValue =
      data.reduce(
        (total, device) =>
          total +
          (device.salePrice ?? 0),
        0,
      );

    const potentialProfit =
      totalSaleValue -
      totalPurchaseValue;

    return {
      data,

      meta: {
        total: data.length,
        pending: pendingDevices,
        available: availableDevices,
        reserved: reservedDevices,
        sold: soldDevices,

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
            potentialProfit,
          ),
      },

      filters,
    };
  }

  async getCommissionsReport(
    filters:
      CommissionsReportQuery,
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

    const sales =
      await prisma.sale.findMany({
        where,

        select: {
          id: true,

          sellerId: true,
          sellerName: true,

          deviceBrand: true,
          deviceModel: true,
          deviceImei: true,
          deviceCondition: true,

          grossSalePrice: true,
          discountAmount: true,
          salePrice: true,
          purchasePrice: true,

          commissionType: true,
          commissionValue: true,
          commissionAmount: true,

          customerName: true,
          soldAt: true,
          createdAt: true,
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

    const data = sales.map((sale) => {
      const grossSalePrice =
        getGrossSalePrice(sale);

      const discountAmount =
        Number(sale.discountAmount);

      const netSalePrice =
        Number(sale.salePrice);

      const purchasePrice =
        Number(sale.purchasePrice);

      const commissionValue =
        sale.commissionValue === null
          ? null
          : Number(
              sale.commissionValue,
            );

      const commissionAmount =
        Number(sale.commissionAmount);

      const profitBeforeCommission =
        netSalePrice - purchasePrice;

      const profitAfterCommission =
        profitBeforeCommission -
        commissionAmount;

      return {
        id: sale.id,

        sellerId: sale.sellerId,
        sellerName: sale.sellerName,

        deviceBrand:
          sale.deviceBrand,

        deviceModel:
          sale.deviceModel,

        deviceImei:
          sale.deviceImei,

        deviceCondition:
          sale.deviceCondition,

        customerName:
          sale.customerName,

        soldAt: sale.soldAt
          .toISOString()
          .slice(0, 10),

        grossSalePrice:
          roundCurrency(
            grossSalePrice,
          ),

        discountAmount:
          roundCurrency(
            discountAmount,
          ),

        salePrice:
          roundCurrency(
            netSalePrice,
          ),

        purchasePrice:
          roundCurrency(
            purchasePrice,
          ),

        commissionType:
          sale.commissionType,

        commissionValue,

        commissionAmount:
          roundCurrency(
            commissionAmount,
          ),

        profitBeforeCommission:
          roundCurrency(
            profitBeforeCommission,
          ),

        profitAfterCommission:
          roundCurrency(
            profitAfterCommission,
          ),
      };
    });

    type SellerSummary = {
      sellerId: string | null;
      sellerName: string;
      totalSales: number;
      commissionedSales: number;
      grossRevenue: number;
      totalDiscount: number;
      netRevenue: number;
      totalCost: number;
      totalCommission: number;
      profitBeforeCommission: number;
      profitAfterCommission: number;
      averageTicket: number;
      averageCommission: number;
    };

    const sellersMap =
      new Map<
        string,
        SellerSummary
      >();

    for (const sale of data) {
      const groupKey =
        sale.sellerId ??
        `legacy:${sale.sellerName}`;

      const current =
        sellersMap.get(
          groupKey,
        ) ?? {
          sellerId:
            sale.sellerId,

          sellerName:
            sale.sellerName,

          totalSales: 0,
          commissionedSales: 0,

          grossRevenue: 0,
          totalDiscount: 0,
          netRevenue: 0,
          totalCost: 0,
          totalCommission: 0,

          profitBeforeCommission: 0,
          profitAfterCommission: 0,

          averageTicket: 0,
          averageCommission: 0,
        };

      current.totalSales += 1;

      if (
        sale.commissionAmount > 0
      ) {
        current.commissionedSales +=
          1;
      }

      current.grossRevenue +=
        sale.grossSalePrice;

      current.totalDiscount +=
        sale.discountAmount;

      current.netRevenue +=
        sale.salePrice;

      current.totalCost +=
        sale.purchasePrice;

      current.totalCommission +=
        sale.commissionAmount;

      current.profitBeforeCommission +=
        sale.profitBeforeCommission;

      current.profitAfterCommission +=
        sale.profitAfterCommission;

      sellersMap.set(
        groupKey,
        current,
      );
    }

    const sellers = Array.from(
      sellersMap.values(),
    )
      .map((seller) => ({
        ...seller,

        grossRevenue:
          roundCurrency(
            seller.grossRevenue,
          ),

        totalDiscount:
          roundCurrency(
            seller.totalDiscount,
          ),

        netRevenue:
          roundCurrency(
            seller.netRevenue,
          ),

        totalCost:
          roundCurrency(
            seller.totalCost,
          ),

        totalCommission:
          roundCurrency(
            seller.totalCommission,
          ),

        profitBeforeCommission:
          roundCurrency(
            seller
              .profitBeforeCommission,
          ),

        profitAfterCommission:
          roundCurrency(
            seller
              .profitAfterCommission,
          ),

        averageTicket:
          roundCurrency(
            seller.totalSales > 0
              ? seller.netRevenue /
                  seller.totalSales
              : 0,
          ),

        averageCommission:
          roundCurrency(
            seller.commissionedSales > 0
              ? seller.totalCommission /
                  seller
                    .commissionedSales
              : 0,
          ),
      }))
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
              secondSeller.sellerName,
              'pt-BR',
            ),
      );

    const totalGrossRevenue =
      data.reduce(
        (total, sale) =>
          total +
          sale.grossSalePrice,
        0,
      );

    const totalDiscount =
      data.reduce(
        (total, sale) =>
          total +
          sale.discountAmount,
        0,
      );

    const totalNetRevenue =
      data.reduce(
        (total, sale) =>
          total +
          sale.salePrice,
        0,
      );

    const totalCost =
      data.reduce(
        (total, sale) =>
          total +
          sale.purchasePrice,
        0,
      );

    const totalCommission =
      data.reduce(
        (total, sale) =>
          total +
          sale.commissionAmount,
        0,
      );

    const totalProfitBeforeCommission =
      totalNetRevenue -
      totalCost;

    const totalProfitAfterCommission =
      totalProfitBeforeCommission -
      totalCommission;

    const commissionedSales =
      data.filter(
        (sale) =>
          sale.commissionAmount > 0,
      ).length;

    return {
      data,
      sellers,

      meta: {
        totalSales: data.length,
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
            totalProfitAfterCommission,
          ),

        averageTicket:
          roundCurrency(
            data.length > 0
              ? totalNetRevenue /
                  data.length
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