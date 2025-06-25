import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'web-app',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        server: 'healthy',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        uptime: Math.round(process.uptime()),
        nextjs: {
          version: process.env.NEXT_RUNTIME || 'nodejs',
          ready: true
        }
      }
    };
    
    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'web-app',
      error: 'Service unavailable'
    }, { status: 503 });
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
