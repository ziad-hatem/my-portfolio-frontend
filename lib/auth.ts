import { NextRequest } from 'next/server';

export function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  const expectedApiKey = process.env.ANALYTICS_API_KEY;

  if (!expectedApiKey) {
    console.error('❌ ANALYTICS_API_KEY environment variable is not set');
    return { valid: false, error: 'Server configuration error: API key not configured' };
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn('⚠️ Unauthorized API access attempt');
    return { valid: false, error: 'Unauthorized: Invalid or missing API key' };
  }

  return { valid: true };
}
