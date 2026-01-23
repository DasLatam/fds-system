import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { requiredEnv } from "@/lib/supabase/env";

export const redis = new Redis({
  url: requiredEnv("UPSTASH_REDIS_REST_URL"),
  token: requiredEnv("UPSTASH_REDIS_REST_TOKEN"),
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "fds:rl",
});
