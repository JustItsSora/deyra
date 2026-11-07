import { NextRequest, NextResponse } from 'next/server';
import { botPatch, BotApiError } from '@/lib/bot';
import { getAdministeredGuild } from '@/lib/guilds';

const ALLOWED_SECTIONS = new Set(['guild', 'automod', 'honeypot', 'antinuke', 'welcome', 'levels', 'tickets', 'music', 'autorole']);
const MAX_BODY_BYTES = 16 * 1024;

type Params = { params: Promise<{ guildId: string; section: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, section } = await params;

  if (!ALLOWED_SECTIONS.has(section)) {
    return NextResponse.json({ message: 'Sección desconocida.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  // Autorización real: el usuario es admin/gestión EN ESE servidor y el bot está ahí.
  const access = await getAdministeredGuild(guildId);
  if (access.status !== 'ok') {
    if (access.status === 'unauthenticated') {
      return NextResponse.json({ message: 'Sesión requerida.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    if (access.status === 'bot-offline') {
      return NextResponse.json({ message: 'El bot no está disponible ahora mismo.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ message: 'No tienes acceso a ese servidor.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!access.guild.botPresent) {
    return NextResponse.json({ message: 'El bot no está en ese servidor.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  }

  const raw = await req.text().catch(() => '');
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ message: 'Cuerpo demasiado grande.' }, { status: 413, headers: { 'Cache-Control': 'no-store' } });
  }

  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ message: 'JSON inválido.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'El cuerpo debe ser un objeto JSON.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const data = await botPatch(`/guilds/${guildId}/${section}`, body);
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    if (err instanceof BotApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status === 400 ? 400 : 502, headers: { 'Cache-Control': 'no-store' } });
    }
    console.error('[api/guilds] Error proxificando PATCH:', err);
    return NextResponse.json({ message: 'Error interno del panel.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
