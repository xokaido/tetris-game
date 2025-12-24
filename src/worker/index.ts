// Cloudflare Worker entry script for Tetris game
// This serves static assets and provides API endpoints for future server-side functionality

export interface Env {
  // Add bindings here as needed (KV, D1, R2, etc.)
  // SCORES_KV: KVNamespace;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API routes for future server-side functionality
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url);
    }

    // For static assets, return null to let Cloudflare serve from the bucket
    // This Worker runs alongside the static asset serving configured in wrangler.toml
    return new Response('Not Found', { status: 404 });
  },
};

async function handleApiRequest(request: Request, url: URL): Promise<Response> {

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // API endpoints for future functionality
  switch (url.pathname) {
    case '/api/health':
      return Response.json({ status: 'ok', game: 'tetris', version: '1.0.0' }, { headers: corsHeaders });

    case '/api/leaderboard':
      // Future: Implement global leaderboard with KV or D1
      return Response.json({
        message: 'Leaderboard endpoint ready for implementation',
        scores: []
      }, { headers: corsHeaders });

    case '/api/scores':
      if (request.method === 'POST') {
        // Future: Save score to database
        const body = await request.json() as { name: string; score: number; level: number; lines: number };
        return Response.json({
          success: true,
          message: 'Score submission ready for implementation',
          received: body
        }, { headers: corsHeaders });
      }
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

    default:
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  }
}
