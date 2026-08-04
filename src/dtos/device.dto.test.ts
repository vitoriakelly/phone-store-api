import { describe, expect, it } from 'vitest';

import {
  createDeviceSchema,
  listDevicesQuerySchema,
  updateDeviceSchema,
} from './device.dto.js';

const validDevice = {
  brand: 'Apple',
  model: 'iPhone 13',
  storage: '128GB',
  color: 'Preto',
  imei: '123456789012345',
  batteryHealth: 95,
  condition: 'SEMINOVO' as const,
  purchasePrice: 2500,
  salePrice: 3200,
  supplier: 'Fornecedor X',
  entryDate: '2026-08-01',
  status: 'DISPONIVEL' as const,
  notes: null,
};

describe('device DTOs', () => {
  it('aceita dispositivo completo disponível', () => {
    const result =
      createDeviceSchema.safeParse(
        validDevice,
      );

    expect(result.success).toBe(true);
  });

  it('permite pendente sem cor, imei e preço de venda', () => {
    const result =
      createDeviceSchema.safeParse({
        ...validDevice,
        color: null,
        imei: null,
        salePrice: null,
        status: 'PENDENTE_INFORMACOES',
      });

    expect(result.success).toBe(true);
  });

  it('exige cor, imei e preço ao disponibilizar', () => {
    const result =
      createDeviceSchema.safeParse({
        ...validDevice,
        color: null,
        imei: null,
        salePrice: null,
        status: 'DISPONIVEL',
      });

    expect(result.success).toBe(false);
  });

  it('rejeita valor de venda menor que compra', () => {
    const result =
      createDeviceSchema.safeParse({
        ...validDevice,
        purchasePrice: 4000,
        salePrice: 3000,
      });

    expect(result.success).toBe(false);
  });

  it('rejeita IMEI inválido', () => {
    const result =
      createDeviceSchema.safeParse({
        ...validDevice,
        imei: '123',
      });

    expect(result.success).toBe(false);
  });

  it('exige ao menos um campo no update', () => {
    const result =
      updateDeviceSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('valida intervalo de datas na listagem', () => {
    const result =
      listDevicesQuerySchema.safeParse({
        page: '1',
        startDate: '2026-08-10',
        endDate: '2026-08-01',
      });

    expect(result.success).toBe(false);
  });
});
