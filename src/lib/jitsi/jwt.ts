import { createHmac } from 'crypto';

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function readRequiredEnv(name: 'JITSI_APP_ID' | 'JITSI_APP_SECRET'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }
  return value;
}

export type JitsiTokenPayload = {
  roomName: string;
  domain: string;
  displayName: string;
  email: string;
  isModerator: boolean;
};

/**
 * JWT HS256 pour Jitsi / JaaS.
 * Les claims `aud`, `iss`, `sub` restent surchargables via .env.
 */
export function createJitsiJwtToken(payload: JitsiTokenPayload): string {
  const appId = readRequiredEnv('JITSI_APP_ID');
  const secret = readRequiredEnv('JITSI_APP_SECRET');

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 2;
  const aud = process.env.JITSI_JWT_AUD?.trim() || 'jitsi';
  const iss = process.env.JITSI_JWT_ISS?.trim() || appId;
  const sub = process.env.JITSI_JWT_SUB?.trim() || payload.domain;
  const kid = process.env.JITSI_JWT_KID?.trim();

  const header: Record<string, string> = { alg: 'HS256', typ: 'JWT' };
  if (kid) header.kid = kid;

  const body = {
    aud,
    iss,
    sub,
    room: payload.roomName,
    exp,
    nbf: now - 5,
    iat: now,
    context: {
      user: {
        name: payload.displayName,
        email: payload.email,
        moderator: payload.isModerator ? 'true' : 'false',
      },
    },
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const unsigned = `${encodedHeader}.${encodedBody}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest();
  return `${unsigned}.${base64url(signature)}`;
}
