import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { OAUTH_STATE_COOKIE } from '@/lib/auth';
import { loginUrl } from '@/lib/discord';

export async function GET(req: NextRequest) {
  const state = randomBytes(16).toString('hex');

  let target: string;
  try {
    target = loginUrl(state);
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.redirect(new URL('/?auth=config', req.url));
  }

  const res = NextResponse.redirect(target);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });
  return res;
}
