import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Crear cliente de Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configurar rate limiting
// 10 requests por minuto por IP
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.RATE_LIMIT_REQUESTS || '10'),
    `${parseInt(process.env.RATE_LIMIT_WINDOW || '60')} s`
  ),
  analytics: true,
  prefix: '@fds-ratelimit',
});

// Rate limit específico para firmas (más restrictivo)
export const signatureRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 firmas por minuto
  analytics: true,
  prefix: '@fds-signature-ratelimit',
});

// Rate limit para creación de contratos
export const contractRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 s'), // 3 contratos por minuto
  analytics: true,
  prefix: '@fds-contract-ratelimit',
});
