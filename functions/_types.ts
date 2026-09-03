export type D1Value = string | number | null;

export interface D1Result<T> {
  results: T[];
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface AnalyticsEnv {
  ANALYTICS_DB?: D1Database;
  ANALYTICS_ADMIN_TOKEN?: string;
}

export interface PagesContext<Env> {
  request: Request;
  env: Env;
}

export type PagesHandler<Env> = (context: PagesContext<Env>) => Response | Promise<Response>;

export function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
