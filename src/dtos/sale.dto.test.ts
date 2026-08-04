import { describe, expect, it } from 'vitest';

import { createSaleSchema } from './sale.dto.js';

const validSale = {
  deviceId:
    '550e8400-e29b-41d4-a716-446655440000',
  sellerId:
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  customerName: 'João Cliente',
  customerPhone: '11999999999',
  customerZipCode: '01310-100',
  customerStreet: 'Av. Paulista',
  customerNeighborhood: 'Bela Vista',
  customerCity: 'São Paulo',
  customerAddressNumber: '1000',
  customerSocialNetwork: '@joao',
  salePrice: 3000,
  discountAmount: 0,
  payments: [
    {
      method: 'PIX' as const,
      amount: 3000,
    },
  ],
  soldAt: '2026-08-03',
};

describe('createSaleSchema', () => {
  it('aceita venda válida com pagamento único', () => {
    const result =
      createSaleSchema.safeParse(
        validSale,
      );

    expect(result.success).toBe(true);
  });

  it('rejeita quando pagamentos não fecham o valor final', () => {
    const result =
      createSaleSchema.safeParse({
        ...validSale,
        payments: [
          {
            method: 'PIX',
            amount: 2500,
          },
        ],
      });

    expect(result.success).toBe(false);
  });

  it('rejeita desconto maior ou igual ao valor da venda', () => {
    const result =
      createSaleSchema.safeParse({
        ...validSale,
        discountAmount: 3000,
        payments: [
          {
            method: 'PIX',
            amount: 0.01,
          },
        ],
      });

    expect(result.success).toBe(false);
  });

  it('exige parcelas no cartão de crédito', () => {
    const result =
      createSaleSchema.safeParse({
        ...validSale,
        payments: [
          {
            method: 'CARTAO_CREDITO',
            amount: 3000,
          },
        ],
      });

    expect(result.success).toBe(false);
  });

  it('exige dispositivo de troca quando há pagamento TROCA_DISPOSITIVO', () => {
    const result =
      createSaleSchema.safeParse({
        ...validSale,
        payments: [
          {
            method:
              'TROCA_DISPOSITIVO',
            amount: 1000,
          },
          {
            method: 'PIX',
            amount: 2000,
          },
        ],
      });

    expect(result.success).toBe(false);
  });

  it('valida comissão percentual e valor final', () => {
    const result =
      createSaleSchema.safeParse({
        ...validSale,
        commissionType: 'PERCENTAGE',
        commissionValue: 10,
      });

    expect(result.success).toBe(true);
  });

  it('rejeita percentual de comissão acima de 100', () => {
    const result =
      createSaleSchema.safeParse({
        ...validSale,
        commissionType: 'PERCENTAGE',
        commissionValue: 150,
      });

    expect(result.success).toBe(false);
  });
});
