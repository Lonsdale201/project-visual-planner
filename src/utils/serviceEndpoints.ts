import type { ServiceEndpoint, ServiceEndpointMethod } from '../model/types';

export const serviceEndpointMethods: ServiceEndpointMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'WS',
];

function normalizeMethod(value: unknown): ServiceEndpointMethod {
  const candidate = String(value ?? '').trim().toUpperCase();
  return serviceEndpointMethods.includes(candidate as ServiceEndpointMethod)
    ? (candidate as ServiceEndpointMethod)
    : 'GET';
}

function normalizeRoute(value: unknown): string {
  return String(value ?? '').trim();
}

function buildStableId(index: number, method: ServiceEndpointMethod, route: string): string {
  const slug = route.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'route';
  return `ep-${index}-${method.toLowerCase()}-${slug}`;
}

export function createServiceEndpoint(
  method: ServiceEndpointMethod = 'GET',
  route = '',
): ServiceEndpoint {
  return {
    id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    route,
  };
}

function parseEndpointLine(rawLine: string, index: number): ServiceEndpoint | null {
  const line = rawLine.trim();
  if (!line) return null;

  const match = line.match(/^(GET|POST|PUT|PATCH|DELETE|WS)\s+(.+)$/i);
  const method = normalizeMethod(match?.[1] ?? 'GET');
  const route = normalizeRoute(match?.[2] ?? line);
  if (!route) return null;

  return {
    id: buildStableId(index, method, route),
    method,
    route,
  };
}

export function parseServiceEndpoints(value: unknown): ServiceEndpoint[] {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const method = normalizeMethod((item as { method?: unknown }).method);
        const route = normalizeRoute((item as { route?: unknown }).route);
        if (!route) return null;

        const id = normalizeRoute((item as { id?: unknown }).id) || buildStableId(index, method, route);
        return { id, method, route };
      })
      .filter((endpoint): endpoint is ServiceEndpoint => endpoint !== null);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line, index) => parseEndpointLine(line, index))
      .filter((endpoint): endpoint is ServiceEndpoint => endpoint !== null);
  }

  return [];
}
