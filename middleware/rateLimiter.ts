import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Different rate limiters for different endpoints
const apiLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 15 * 60, // Per 15 minutes
});

const contactFormLimiter = new RateLimiterMemory({
  points: 5, // Number of submissions
  duration: 60 * 60, // Per hour
});

const loginLimiter = new RateLimiterMemory({
  points: 5, // Number of attempts
  duration: 15 * 60, // Per 15 minutes
});

const publicPageLimiter = new RateLimiterMemory({
  points: 300, // Number of requests
  duration: 15 * 60, // Per 15 minutes
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function rateLimit(
  request: NextRequest,
  limiterType: 'api' | 'contact' | 'login' | 'public' = 'api'
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  let limiter: RateLimiterMemory;
  switch (limiterType) {
    case 'contact':
      limiter = contactFormLimiter;
      break;
    case 'login':
      limiter = loginLimiter;
      break;
    case 'public':
      limiter = publicPageLimiter;
      break;
    default:
      limiter = apiLimiter;
  }

  try {
    await limiter.consume(ip);
    return null; // Rate limit not exceeded
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
      },
      { status: 429 }
    );
  }
}

export async function checkRateLimit(ip: string, limiterType: 'api' | 'contact' | 'login' | 'public' = 'api'): Promise<boolean> {
  let limiter: RateLimiterMemory;
  switch (limiterType) {
    case 'contact':
      limiter = contactFormLimiter;
      break;
    case 'login':
      limiter = loginLimiter;
      break;
    case 'public':
      limiter = publicPageLimiter;
      break;
    default:
      limiter = apiLimiter;
  }

  try {
    await limiter.consume(ip);
    return true;
  } catch (error) {
    return false;
  }
}
