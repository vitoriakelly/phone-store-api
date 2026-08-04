import { vi } from 'vitest';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

export function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    device: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    sale: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

export type PrismaMock = ReturnType<
  typeof createPrismaMock
>;

export function createMockRequest(
  overrides: Partial<Request> = {},
): Request {
  return {
    body: {},
    params: {},
    query: {},
    cookies: {},
    ...overrides,
  } as Request;
}

export function createMockResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    cookies: {} as Record<
      string,
      unknown
    >,
    clearedCookies: [] as string[],
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };

  response.status.mockImplementation(
    (code: number) => {
      response.statusCode = code;
      return response;
    },
  );

  response.json.mockImplementation(
    (payload: unknown) => {
      response.body = payload;
      return response;
    },
  );

  response.cookie.mockImplementation(
    (
      name: string,
      value: unknown,
    ) => {
      response.cookies[name] = value;
      return response;
    },
  );

  response.clearCookie.mockImplementation(
    (name: string) => {
      response.clearedCookies.push(
        name,
      );
      return response;
    },
  );

  return response as typeof response &
    Response;
}

export function createMockNext() {
  return vi.fn() as NextFunction &
    ReturnType<typeof vi.fn>;
}
