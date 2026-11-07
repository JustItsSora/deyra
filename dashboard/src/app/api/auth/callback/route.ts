import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { exchangeCode, fetchUser } from '@/lib/discord';
import { OAUTH_STATE_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?auth=denied', req.url));
  }

  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/?auth=state', req.url));
  }

  try {
    const { access_token } = await exchangeCode(code);
    const user = await fetchUser(access_token);

    await createSession({
      sub: user.id,
      username: user.global_name || user.username,
      avatar: user.avatar ?? null,
      accessToken: access_token,
    });

    const res = NextResponse.redirect(new URL('/dashboard', req.url));
    res.cookies.set(OAUTH_STATE_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return res;
  } catch (err) {
    console.error('[auth/callback]', err);
    return NextResponse.redirect(new URL('/?auth=error', req.url));
  }
}
