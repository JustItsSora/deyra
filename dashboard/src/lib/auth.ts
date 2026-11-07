import 'server-only';
import { createHash } from 'crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'deyra_session';
export const OAUTH_STATE_COOKIE = 'deyra_oauth_state';
const SESSION_DAYS = 7;

export type Session = {
  sub: string;
  username: string;
  avatar: string | null;
  accessToken: string;
};

function secretKey(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error('SESSION_SECRET falta o es demasiado corto (mínimo 16 caracteres).');
  }
  return new Uint8Array(createHash('sha256').update(raw).digest());
}

export async function createSession(input: Session): Promise<void> {
  const token = await new EncryptJWT({ ...input })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .encrypt(secretKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtDecrypt(token, secretKey());
    const { sub, username, avatar, accessToken } = payload as Record<string, unknown>;
    if (typeof sub !== 'string' || typeof username !== 'string' || typeof accessToken !== 'string') {
      return null;
    }
    return { sub, username, avatar: typeof avatar === 'string' ? avatar : null, accessToken };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
