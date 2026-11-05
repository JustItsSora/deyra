import Link from 'next/link';
import {
  ArrowRight, ShieldCheck, Radar, Zap, DoorOpen, ScrollText, Settings2,
  Lock, BadgeCheck, Server, ChevronRight, Users, AlertCircle,
} from 'lucide-react';
import { inviteUrl } from '@/lib/discord';

const AUTH_MESSAGES: Record<string, string> = {
  denied: 'Cancelaste el inicio de sesión en Discord. Puedes volver a intentarlo cuando quieras.',
  state: 'La sesión de inicio caducó. Vuelve a intentarlo.',
  error: 'Discord no pudo completar el inicio de sesión. Inténtalo de nuevo.',
  config: 'El panel aún no tiene credenciales OAuth configuradas (DISCORD_CLIENT_ID / DISCORD_REDIRECT_URI).',
};

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const { auth } = await searchParams;
  const authMessage = auth ? AUTH_MESSAGES[auth] : undefined;
  const invite = inviteUrl();
  const ctaHref = invite ?? '/api/auth/login';

  return (
    <>
      <header className="land-nav">
        <Link href="/" className="brand" aria-label="Deyra — inicio">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-word">Deyra</span>
        </Link>
        <nav className="nav-links" aria-label="Secciones">
          <a href="#funciones">Funciones</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#seguridad">Seguridad</a>
        </nav>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="btn btn-ghost btn-sm" href="/api/auth/login">Iniciar sesión</a>
          <a className="btn btn-primary btn-sm" href={ctaHref}>Añadir a Discord</a>
        </div>
      </header>

      <main>
        {authMessage && (
          <div className="content" style={{ paddingTop: 14, paddingBottom: 0 }}>
            <div className="callout danger" role="alert">
              <AlertCircle className="icon" aria-hidden="true" />
              <span>{authMessage}</span>
            </div>
          </div>
        )}
        <section className="hero">
          <div>
            <span className="kicker">Panel de control</span>
            <h1 className="display">Un servidor bajo control, sin memorizar comandos.</h1>
            <p className="lead">
              Deyra es el bot todo-en-uno para servidores exigentes: automod avanzado,
              honeypot, anti-nuke, tickets, niveles y música. Ahora, toda su configuración
              vive también en este panel: eliges el servidor y ajustas con tu cuenta de
              Discord.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href={ctaHref}>
                Añadir a Discord
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="btn btn-ghost" href="/api/auth/login">Iniciar sesión</a>
            </div>
            <p className="micro"><Lock size={13} aria-hidden="true" /> OAuth oficial de Discord · Gratis · Solo administras lo que ya administras</p>
          </div>

          <div className="mock" aria-hidden="true">
            <div className="mock-bar">
              <span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" />
              <span className="mock-title">Deyra · Automod</span>
            </div>
            <div className="mock-body">
              <div className="mock-row"><span className="name"><ShieldCheck size={16} />Anti-invitaciones</span><span className="pill ok">Activo</span></div>
              <div className="mock-row"><span className="name"><Zap size={16} />Anti-nuke (audit log)</span><span className="pill ok">Activo</span></div>
              <div className="mock-row"><span className="name"><Radar size={16} />Honeypot en #free-gifts</span><span className="pill ok">Activo</span></div>
              <div className="mock-row"><span className="name"><ScrollText size={16} />Registro de mensajes</span><span className="pill warn">Sin canal</span></div>
            </div>
            <div className="mock-foot">Cambios aplicados en vivo sobre la base de datos del bot.</div>
          </div>
        </section>

        <div className="stats-strip" aria-label="En cifras">
          <div className="inner">
            <div className="item"><b>548</b><span>comandos híbridos</span></div>
            <div className="item"><b>31</b><span>tablas de datos</span></div>
            <div className="item"><b>7</b><span>protecciones automáticas</span></div>
            <div className="item"><b>0 €</b><span>para siempre en el panel</span></div>
          </div>
        </div>

        <section className="section" id="funciones">
          <span className="kicker">Qué configura este panel</span>
          <h2 className="display">Todo lo que antes memorizabas, ahora lo ves.</h2>
          <p className="sub">Cada sección del panel escribe en la misma configuración que usan los comandos: lo que actives aquí funciona al instante, sin reinicios ni copiar IDs.</p>

          <div className="feature-grid">
            <article className="feature f-lead">
              <div className="ic"><ShieldCheck size={20} aria-hidden="true" /></div>
              <h3>Automod que entiende el contexto</h3>
              <p>Filtro de invites ampliado, enlaces con lista blanca de dominios, spam por frecuencia y por contenido duplicado, menciones que cuentan usuarios, roles y @everyone, mayúsculas, palabras prohibidas con límites de palabra — y escalada automática: 5 infracciones en 30 días y la sanción sube sola.</p>
            </article>
            <article className="feature f-std">
              <div className="ic"><Radar size={20} aria-hidden="true" /></div>
              <h3>Honeypot</h3>
              <p>Un canal señuelo donde solo escriben bots de raid. Quien cae, fuera.</p>
            </article>
            <article className="feature f-std">
              <div className="ic"><Zap size={20} aria-hidden="true" /></div>
              <h3>Anti-nuke</h3>
              <p>Vigila el audit log: borrados de canales, roles, baneos masivos y webhooks.</p>
            </article>
            <article className="feature f-std">
              <div className="ic"><DoorOpen size={20} aria-hidden="true" /></div>
              <h3>Bienvenidas</h3>
              <p>Canal, mensaje con variables y despedida. Tarjetas de bienvenida opcionales.</p>
            </article>
            <article className="feature f-std">
              <div className="ic"><ScrollText size={20} aria-hidden="true" /></div>
              <h3>Registros</h3>
              <p>Canales de log para moderación, entradas/salidas y mensajes borrados o editados.</p>
            </article>
            <article className="feature f-std">
              <div className="ic"><Settings2 size={20} aria-hidden="true" /></div>
              <h3>Ajustes generales</h3>
              <p>Prefijo, idioma y política de contenido del servidor, con validación en vivo.</p>
            </article>
          </div>
        </section>

        <section className="section" id="como-funciona" style={{ paddingTop: 8 }}>
          <span className="kicker">Cómo funciona</span>
          <h2 className="display">Tres pasos, cero terminal.</h2>

          <div className="steps">
            <div className="step">
              <div className="num">01</div>
              <h3>Invita a Deyra</h3>
              <p>Añádela a tu servidor con los permisos que necesita cada función. Sin permisos de más: el panel te avisa si falta alguno.</p>
            </div>
            <div className="step">
              <div className="num">02</div>
              <h3>Inicia sesión con Discord</h3>
              <p>OAuth oficial. Deyra solo lee tus servidores y tus permisos; nunca tu contraseña ni tus mensajes.</p>
            </div>
            <div className="step">
              <div className="num">03</div>
              <h3>Ajusta tu servidor</h3>
              <p>Ves los servidores donde eres administrador y Deyra está presente. Eliges uno y editas su configuración.</p>
            </div>
          </div>
        </section>

        <section className="section" id="seguridad" style={{ paddingTop: 8 }}>
          <div className="security">
            <div>
              <span className="kicker">Seguridad</span>
              <h2 className="display">Tu cuenta no sale de Discord. Tus permisos mandan.</h2>
              <p className="sub" style={{ marginTop: 12 }}>El panel no guarda nada en claro ni comparte tu sesión con el bot: la API del bot valida cada cambio y el panel solo actúa sobre servidores donde tú ya puedes administrar.</p>
              <div className="check-list">
                {[
                  'Sesión firmada y cifrada en cookie httpOnly. Nada de tokens en localStorage.',
                  'El panel solo lista servidores donde tienes administrador o gestión del servidor y Deyra está dentro.',
                  'Cada guardado pasa por la misma validación que los comandos: nada de valores arbitrarios en tu servidor.',
                  'Sin acceso a mensajes, DMs ni contenido privado. Solo lectura de la configuración.',
                ].map((item) => (
                  <div key={item} className="check-item">
                    <BadgeCheck size={19} aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-pad" aria-label="Requisitos">
              <span className="kicker">Lo que necesitas</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 560, marginTop: 10 }}>Nada que no tengas ya</h3>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {[
                  { icon: Server, text: 'Deyra invitada a tu servidor (o el botón de arriba).' },
                  { icon: Users, text: 'Permiso de administrador o de gestión del servidor en Discord.' },
                  { icon: Lock, text: 'Tu cuenta de Discord. Sin formularios ni registro extra.' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="check-item" style={{ alignItems: 'center' }}>
                    <Icon size={19} aria-hidden="true" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span className="muted">{text}</span>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <a className="btn btn-primary btn-block" href={ctaHref}>
                Añadir a Discord
                <ChevronRight size={17} aria-hidden="true" />
              </a>
              <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>¿Ya la tienes? <a href="/api/auth/login" style={{ color: 'var(--accent-hover)' }}>Inicia sesión</a></p>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 8 }}>
          <span className="kicker">Preguntas</span>
          <div className="faq">
            <details>
              <summary>¿El panel es gratis?<ChevronRight className="chev" size={18} aria-hidden="true" /></summary>
              <p>Sí. El panel es parte de Deyra y no tiene planes de pago ni límites de uso. Lo que consumes es la propia base de datos de tu instancia del bot.</p>
            </details>
            <details>
              <summary>¿Quién puede ver y cambiar la configuración?<ChevronRight className="chev" size={18} aria-hidden="true" /></summary>
              <p>Solo miembros del servidor con permiso de administrador o de gestión del servidor, y únicamente en los servidores donde Deyra está presente. Un miembro normal no ve nada del panel de ese servidor.</p>
            </details>
            <details>
              <summary>¿Dónde se guardan los datos?<ChevronRight className="chev" size={18} aria-hidden="true" /></summary>
              <p>En la misma base de datos del bot que ya usas (SQLite). El panel no guarda copias: cada cambio va directo a esa base y los comandos leen de ahí.</p>
            </details>
          </div>
        </section>
      </main>

      <footer className="land-footer">
        <div className="inner">
          <div className="brand" style={{ textDecoration: 'none' }}>
            <span className="brand-mark" aria-hidden="true" style={{ width: 26, height: 26, fontSize: 15 }}>D</span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Deyra · Todo en uno para tu servidor</span>
          </div>
          <a className="btn btn-ghost btn-sm" href={ctaHref}>Añadir a Discord</a>
        </div>
      </footer>
    </>
  );
}
