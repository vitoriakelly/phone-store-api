import { prisma } from '../config/prisma.js';
import type {
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

export class ReportService {
  async getSalesReport(filters: SalesReportQuery) {
    const where: Prisma.SaleWhereInput = {};

    if (filters.startDate || filters.endDate) {
      where.soldAt = {
        ...(filters.startDate
          ? {
              gte: getStartOfDay(filters.startDate),
            }
          : {}),
        ...(filters.endDate
          ? {
              lte: getEndOfDay(filters.endDate),
            }
          : {}),
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
        contains: filters.customerName,
        mode: 'insensitive',
      };
    }

    if (filters.deviceName) {
      where.OR = [
        {
          deviceBrand: {
            contains: filters.deviceName,
            mode: 'insensitive',
          },
        },
        {
          deviceModel: {
            contains: filters.deviceName,
            mode: 'insensitive',
          },
        },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: [
        {
          soldAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    const totalRevenue = sales.reduce(
      (total, sale) =>
        total + Number(sale.salePrice),
      0,
    );

    const totalCost = sales.reduce(
      (total, sale) =>
        total + Number(sale.purchasePrice),
      0,
    );

    const totalProfit = totalRevenue - totalCost;

    const averageTicket =
      sales.length > 0
        ? totalRevenue / sales.length
        : 0;

    return {
      data: sales,
      meta: {
        total: sales.length,
        totalRevenue,
        totalCost,
        totalProfit,
        averageTicket,
      },
      filters,
    };
  }

  async getDevicesReport(
    filters: DevicesReportQuery,
  ) {
    const where: Prisma.DeviceWhereInput = {};

    if (filters.startDate || filters.endDate) {
      where.entryDate = {
        ...(filters.startDate
          ? {
              gte: getStartOfDay(filters.startDate),
            }
          : {}),
        ...(filters.endDate
          ? {
              lte: getEndOfDay(filters.endDate),
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
        contains: filters.supplier,
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
            contains: filters.deviceName,
            mode: 'insensitive',
          },
        },
        {
          model: {
            contains: filters.deviceName,
            mode: 'insensitive',
          },
        },
      ];
    }

    const devices = await prisma.device.findMany({
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

    const availableDevices = devices.filter(
      (device) =>
        device.status === 'DISPONIVEL',
    ).length;

    const reservedDevices = devices.filter(
      (device) =>
        device.status === 'RESERVADO',
    ).length;

    const soldDevices = devices.filter(
      (device) =>
        device.status === 'VENDIDO',
    ).length;

    const totalPurchaseValue = devices.reduce(
      (total, device) =>
        total + Number(device.purchasePrice),
      0,
    );

    const totalSaleValue = devices.reduce(
      (total, device) =>
        total + Number(device.salePrice),
      0,
    );

    const potentialProfit =
      totalSaleValue - totalPurchaseValue;

    return {
      data: devices,
      meta: {
        total: devices.length,
        available: availableDevices,
        reserved: reservedDevices,
        sold: soldDevices,
        totalPurchaseValue,
        totalSaleValue,
        potentialProfit,
      },
      filters,
    };
  }
}

export const reportService =
  new ReportService();