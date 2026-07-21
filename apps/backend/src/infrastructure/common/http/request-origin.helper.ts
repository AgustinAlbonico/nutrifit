import type { Request } from 'express';

export interface OrigenRequest {
  ip: string | null;
  userAgent: string | null;
}

export function extraerOrigenRequest(request: Request): OrigenRequest {
  const forwardedFor = request.headers['x-forwarded-for'];
  const ipForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];

  return {
    ip: limpiarIp(
      ipForwarded ?? request.ip ?? request.socket.remoteAddress ?? null,
    ),
    userAgent: request.headers['user-agent'] ?? null,
  };
}

function limpiarIp(ip: string | null): string | null {
  if (!ip) {
    return null;
  }

  return ip.trim().replace(/^::ffff:/, '');
}
