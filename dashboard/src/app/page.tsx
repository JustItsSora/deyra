import Link from 'next/link';
import { ArrowRight, Volume2 } from 'lucide-react';
import { inviteUrl } from '@/lib/discord';
import SoundToggle from '@/components/SoundToggle';

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
      <header className="site-nav">
        <div className="inner">
          <Link href="/" className="wordmark" aria-label="Deyra, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mark" src="/logo.png" alt="" width={34} height={34} />
            <span className="word">Deyra</span>
          </Link>
          <nav className="nav-links" aria-label="Secciones">
            <a href="#servicio">El servicio</a>
            <a href="#panel">El panel</a>
            <a href="#garantia">Garantía</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nav-actions">
            <SoundToggle />
            <a className="btn btn-ghost btn-sm" href="/api/auth/login">Iniciar sesión</a>
            <a className="btn btn-primary btn-sm" href={ctaHref}>Añadir a Discord</a>
          </div>
        </div>
      </header>

      <main>
        {authMessage && (
          <div className="content" style={{ paddingTop: 14, paddingBottom: 0 }}>
            <div className="callout danger" role="alert">
              <Volume2 size={16} aria-hidden="true" />
              <span>{authMessage}</span>
            </div>
          </div>
        )}

        <section className="hero">
          <div>
            <span className="eyebrow">548 comandos híbridos</span>
            <h1>Tu servidor, <em>en orden</em> antes de que arda.</h1>
            <p className="lede">
              Deyra modera, filtra y responde mientras tú vives: automod, honeypot,
              anti-nuke, tickets, niveles y música. Sin memorizar comandos,{' '}
              <b>sin rituales, sin letra pequeña</b>.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href={ctaHref}>Añadir a Discord</a>
              <a className="btn btn-ghost" href="/api/auth/login">Iniciar sesión</a>
            </div>
            <p className="micro">
              <span>Instalación en 30 segundos</span>
              <span>Permisos mínimos</span>
            </p>
          </div>

          <div className="medallion" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/danica.jpg" alt="" fetchPriority="high" />
          </div>
        </section>

        <div className="spec-strip" aria-label="Ficha técnica">
          <span><b>548</b> comandos híbridos</span>
          <span><b>31</b> tablas de datos</span>
          <span><b>7</b> protecciones automáticas</span>
          <span><b>0 €</b> para siempre</span>
        </div>

        <section className="ledger" id="servicio" aria-label="Lo que hace">
          <span className="eyebrow">El servicio</span>
          <h2>Lo que hace, sin letra pequeña.</h2>
          <p className="sub">Seis líneas corresponden a sistemas reales corriendo hoy. Lo que lees es exactamente lo que hace; nada de relleno de marketing.</p>

          <div className="ledger-rows">
            <a className="row" href="#panel">
              <span className="num">01</span>
              <span><span className="name">Moderación con memoria</span><span className="line">Ban, kick, warn, lockdown y purge con registro en el canal que tú elijas.</span></span>
              <span className="cmd">/ban</span>
            </a>
            <a className="row" href="#panel">
              <span className="num">02</span>
              <span><span className="name">Automod que entiende el contexto</span><span className="line">Invites, enlaces con lista blanca, spam por frecuencia o duplicado, menciones con roles y @everyone, mayúsculas y palabras con límites de palabra.</span></span>
              <span className="cmd">/automod</span>
            </a>
            <a className="row" href="#panel">
              <span className="num">03</span>
              <span><span className="name">Honeypot con trampa giratoria</span><span className="line">Un canal señuelo con el nombre cambiando solo: el bot de raid que escribe ahí no vuelve.</span></span>
              <span className="cmd">/honeypot</span>
            </a>
            <a className="row" href="#panel">
              <span className="num">04</span>
              <span><span className="name">Anti-nuke sobre el audit log</span><span className="line">Borrados masivos de canales, roles o baneos: detecta la ráfaga y la corta antes de que arrase.</span></span>
              <span className="cmd">/antinuke</span>
            </a>
            <a className="row" href="#panel">
              <span className="num">05</span>
              <span><span className="name">Tickets de verdad</span><span className="line">Panel con categorías, equipo de soporte y cierre con transcripción al archivar.</span></span>
              <span className="cmd">/ticket</span>
            </a>
            <a className="row" href="#panel">
              <span className="num">06</span>
              <span><span className="name">Niveles que sirven</span><span className="line">XP por participar y recompensas por rol, sin grind falso ni ranking inflado.</span></span>
              <span className="cmd">/level</span>
            </a>
          </div>
        </section>

        <section className="panel-wrap" id="panel" aria-label="El panel">
          <div className="panel-copy">
            <span className="eyebrow">El panel</span>
            <h2>El bot, por dentro y sin disfraces.</h2>
            <p>
              La misma configuración que leen los comandos, en vivo. Cuando guardas en el
              panel, el bot ya lo está haciendo: respuesta instantánea, sin reinicios ni
              copiar IDs.
            </p>
            <ul className="panel-list">
              <li>Solo quienes pueden administrar el servidor lo ven.</li>
              <li>Cada guardado pasa la misma validación que un comando real.</li>
              <li>Tus datos viven en tu instancia del bot, no en un tercero.</li>
            </ul>
            <Link className="text-link" href="/dashboard">Abrir el panel <ArrowRight size={16} aria-hidden="true" style={{ verticalAlign: -2 }} /></Link>
          </div>

          <div className="plate" aria-label="Vista esquemática del panel">
            <div className="plate-bar">
              <span className="dot" /><span className="dot" /><span className="dot" />
              <span className="plate-title">Deyra · Panel</span>
            </div>
            <div className="plate-body">
              <div className="prow"><span><b>Automod</b> · invites, links con allowlist</span><span className="ok">Activo</span></div>
              <div className="prow"><span><b>Honeypot</b> · #free-gifts · rotación 6h</span><span className="ok">Activo</span></div>
              <div className="prow"><span><b>Anti-nuke</b> · umbral 3 / 10 min</span><span className="ok">Activo</span></div>
              <div className="prow"><span><b>Tickets</b> · categoría Soporte</span><span className="warn">2 abiertos</span></div>
              <div className="prow"><span><b>Registro</b> · #modlog · mensajes y miembros</span><span className="ok">Activo</span></div>
            </div>
          </div>
        </section>

        <section className="oath" id="garantia" aria-label="Garantía">
          <div>
            <span className="eyebrow">Garantía</span>
            <p className="big">No toca tu cuenta.<br />Toca <em>tu servidor.</em></p>
            <div className="rule">
              <p><b>El panel nunca ve tus mensajes ni tus DMs.</b> Ve la configuración del servidor y tu permiso para administrarlo, nada más.</p>
              <p><b>Nada viaja a terceros.</b> La base de datos vive donde corre el bot, y el bot valida cada cambio como un comando real.</p>
              <p><b>Discord es de Discord.</b> Deyra no es un servicio de Discord ni está afiliada con Discord Inc. Es un bot independiente que convive con él.</p>
            </div>
          </div>
        </section>

        <section className="faq" id="preguntas" aria-label="Preguntas">
          <span className="eyebrow">Preguntas</span>
          <h2>Sin letra pequeña.</h2>
          <details>
            <summary>¿Cuánto cuesta?<ArrowRight size={16} className="chev" aria-hidden="true" /></summary>
            <p>Nada. Es gratis, y tus datos viven en el servidor del bot.</p>
          </details>
          <details>
            <summary>¿Quién puede ver y cambiar la configuración?<ArrowRight size={16} className="chev" aria-hidden="true" /></summary>
            <p>Solo miembros con permiso de administrador o de gestión del servidor, y únicamente en los servidores donde Deyra está presente. Un miembro normal no ve nada del panel.</p>
          </details>
          <details>
            <summary>¿Se lleva mi cuenta o mi correo?<ArrowRight size={16} className="chev" aria-hidden="true" /></summary>
            <p>No. El login pasa por el OAuth oficial de Discord; la sesión vive en una cookie httpOnly y el bot nunca la ve. El panel habla con el bot por HTTPS y valida todo.</p>
          </details>
          <details>
            <summary>¿Puedo salir cuando quiera?<ArrowRight size={16} className="chev" aria-hidden="true" /></summary>
            <p>Sí. Desinstalar el bot te devuelve tu servidor tal cual estaba: la configuración vive donde corrió siempre, en tu propia instancia.</p>
          </details>
        </section>
      </main>

      <div className="closing">
        <div className="inner">
          <div className="closing-copy">
            <span className="eyebrow-ink">Cierre</span>
            <h2>Sellar tu servidor.</h2>
            <p>Añádela y en treinta segundos el orden vuelve a reinar.</p>
            <a className="btn-ink" href={ctaHref}>Añadir a Discord<ArrowRight size={17} aria-hidden="true" /></a>
          </div>
          <span className="closing-mark" aria-hidden="true">D</span>
        </div>
      </div>

      <footer className="footer">
        <div className="inner">
          <span>Deyra — orden para tu servidor.</span>
          <span>No afiliada con Discord Inc. · Hecha en español.</span>
          <Link href="/dashboard">Abrir el panel</Link>
        </div>
      </footer>
    </>
  );
}
