import type { Request, Response, NextFunction } from 'express';
import { store } from '../data/store.js';
import { CONFIG } from '../config/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/** UUID v4 pattern used by test tokens */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true when the token is a local development / test identity that should
 * never be forwarded to an external auth provider.
 */
function isLocalTestToken(token: string): boolean {
  return (
    token === 'demo-token' ||
    token.startsWith('demo-user-') ||
    token.startsWith('user-') ||
    UUID_RE.test(token)
  );
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // ── In development / test environments, resolve local test identities first
  // so that UUID-format tokens never reach a live Supabase Auth endpoint.
  if (CONFIG.nodeEnv !== 'production' && isLocalTestToken(token)) {
    req.user = {
      id: token === 'demo-token'
        ? '00000000-0000-0000-0000-000000000001'
        : token,
    };
    next();
    return;
  }

  // ── In production (or when Supabase is configured), verify via Supabase Auth
  const supabase = store.getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Session invalid or expired. Please sign in again.',
          },
        });
        return;
      }
      req.user = { id: user.id, email: user.email };
      next();
      return;
    } catch {
      res.status(401).json({
        error: {
          code: 'AUTH_VERIFICATION_FAILED',
          message: 'Unable to verify authentication token.',
        },
      });
      return;
    }
  }

  // ── No auth provider available and token is not a recognised local identity
  res.status(401).json({
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid session token. Please sign in.',
    },
  });
}
