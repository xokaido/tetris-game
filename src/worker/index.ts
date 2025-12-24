import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export interface Env {
  // Add bindings here as needed (KV, D1, R2, etc.)
  // SCORES_KV: KVNamespace;
  __STATIC_CONTENT: unknown;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API routes for future server-side functionality
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url);
    }

    try {
      // Serve static assets from KV
      return await getAssetFromKV({
        request,
        waitUntil: ctx.waitUntil.bind(ctx)
      }, {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest
      });
    } catch (e) {
      if (e instanceof Error) {
        // Fallback for SPA: serve index.html for unknown routes not starting with /api
        // But for now, let's just return 404 if asset not found to be safe, 
        // or try to serve index.html if it's a navigation request.
        // For a game, typically we just want to load index.html.
        /*
        try {
           return await getAssetFromKV({
             request: new Request(new URL('/index.html', request.url), request),
             waitUntil: ctx.waitUntil.bind(ctx)
           }, {
             ASSET_NAMESPACE: env.__STATIC_CONTENT,
             ASSET_MANIFEST: assetManifest
           });
        } catch {}
        */
      }
      return new Response('Not Found: ' + (e instanceof Error ? e.message : 'Unknown Error'), { status: 404 });
    }
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
