import Link from 'next/link';
import { ArrowRight, Plus, Ban, ShieldCheck, Radar, ShieldAlert, Ticket, TrendingUp } from 'lucide-react';
import { inviteUrl } from '@/lib/discord';
import SoundToggle from '@/components/SoundToggle';

const AUTH_MESSAGES: Record<string, string> = {
  denied: 'Cancelaste el inicio de sesión en Discord. Puedes volver a intentarlo cuando quieras.',
  state: 'La sesión de inicio caducó. Vuelve a intentarlo.',
  error: 'Discord no pudo completar el inicio de sesión. Inténtalo de nuevo.',
  config: 'El panel aún no tiene credenciales OAuth configuradas (DISCORD_CLIENT_ID / DISCORD_REDIRECT_URI).',
};

const FEATURES = [
  { icon: Ban, name: 'Moderación con memoria', line: 'Ban, kick, warn, lockdown y purge con registro en el canal que tú elijas.', cmd: '/ban' },
  { icon: ShieldCheck, name: 'Automod que entiende el contexto', line: 'Invites, enlaces con lista blanca, spam por frecuencia o duplicado, menciones con roles y @everyone, mayúsculas y palabras con límites de palabra.', cmd: '/automod' },
  { icon: Radar, name: 'Honeypot con trampa giratoria', line: 'Un canal señuelo con el nombre cambiando solo: el bot de raid que escribe ahí no vuelve.', cmd: '/honeypot' },
  { icon: ShieldAlert, name: 'Anti-nuke sobre el audit log', line: 'Borrados masivos de canales, roles o baneos: detecta la ráfaga y la corta antes de que arrase.', cmd: '/antinuke' },
  { icon: Ticket, name: 'Tickets de verdad', line: 'Panel con categorías, equipo de soporte y cierre con transcripción al archivar.', cmd: '/ticket' },
  { icon: TrendingUp, name: 'Niveles que sirven', line: 'XP por participar y recompensas por rol, sin grind falso ni ranking inflado.', cmd: '/level' },
];

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
            <img className="mark" src="/logo.png" alt="" width={28} height={28} />
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
              <ShieldAlert className="icon" aria-hidden="true" />
              <span>{authMessage}</span>
            </div>
          </div>
        )}

        <section className="hero">
          <div className="hero-copy">
            <span className="kicker">548 comandos, slash y prefijo</span>
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

          <figure className="portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/danica.jpg" alt="Danica" fetchPriority="high" />
          </figure>
        </section>

        <div className="spec-strip" aria-label="Ficha técnica">
          <span><b>548</b> comandos</span>
          <span><b>31</b> tablas de datos</span>
          <span><b>7</b> protecciones automáticas</span>
          <span><b>0 €</b> para siempre</span>
        </div>

        <section className="section" id="servicio" aria-label="Lo que hace">
          <span className="kicker">El servicio</span>
          <h2 className="section-title">Lo que hace, sin letra pequeña.</h2>
          <p className="section-sub">Cada tarjeta es un sistema que ya está corriendo hoy. Lo que lees es exactamente lo que hace: ni roadmap ni relleno.</p>

          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, name, line, cmd }) => (
              <a key={name} className="feature-card" href="#panel">
                <Icon className="feature-icon" size={22} aria-hidden="true" />
                <span className="feature-name">{name}</span>
                <span className="feature-desc">{line}</span>
                <code className="feature-cmd">{cmd}</code>
              </a>
            ))}
          </div>
        </section>

        <section className="section" id="panel" aria-label="El panel">
          <span className="kicker">El panel</span>
          <h2 className="section-title">El bot, por dentro y sin disfraces.</h2>
          <p className="section-sub">
            La misma configuración que leen los comandos, en vivo. Cuando guardas en el
            panel, el bot ya lo está haciendo: respuesta instantánea, sin reinicios ni
            copiar IDs.
          </p>
          <ul className="panel-list">
            <li>Solo quienes pueden administrar el servidor lo ven.</li>
            <li>Cada guardado pasa la misma validación que un comando real.</li>
            <li>Tus datos viven en tu instancia del bot, no en un tercero.</li>
          </ul>
          <Link className="text-link panel-cta" href="/dashboard">
            Abrir el panel <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className="oath" id="garantia" aria-label="Garantía">
          <div className="oath-head">
            <span className="kicker">Garantía</span>
            <p className="big">No toca tu cuenta.<br />Toca <em>tu servidor.</em></p>
          </div>
          <div className="oath-clauses">
            <div className="clause">
              <span className="n" aria-hidden="true">I</span>
              <p><b>El panel nunca ve tus mensajes ni tus DMs.</b> Ve la configuración del servidor y tu permiso para administrarlo, nada más.</p>
            </div>
            <div className="clause">
              <span className="n" aria-hidden="true">II</span>
              <p><b>Nada viaja a terceros.</b> La base de datos vive donde corre el bot, y el bot valida cada cambio como un comando real.</p>
            </div>
            <div className="clause">
              <span className="n" aria-hidden="true">III</span>
              <p><b>Discord es de Discord.</b> Deyra no es un servicio de Discord ni está afiliada con Discord Inc. Es un bot independiente que convive con él.</p>
            </div>
          </div>
        </section>

        <section className="faq" id="preguntas" aria-label="Preguntas">
          <span className="kicker">Preguntas</span>
          <h2 className="section-title">Antes de añadirla.</h2>
          <details>
            <summary>¿Cuánto cuesta?<Plus size={16} className="chev" aria-hidden="true" /></summary>
            <p>Nada. Es gratis, y tus datos viven en el servidor del bot.</p>
          </details>
          <details>
            <summary>¿Quién puede ver y cambiar la configuración?<Plus size={16} className="chev" aria-hidden="true" /></summary>
            <p>Solo miembros con permiso de administrador o de gestión del servidor, y únicamente en los servidores donde Deyra está presente. Un miembro normal no ve nada del panel.</p>
          </details>
          <details>
            <summary>¿Se lleva mi cuenta o mi correo?<Plus size={16} className="chev" aria-hidden="true" /></summary>
            <p>No. El login pasa por el OAuth oficial de Discord; la sesión vive en una cookie httpOnly y el bot nunca la ve. El panel habla con el bot por HTTPS y valida todo.</p>
          </details>
          <details>
            <summary>¿Puedo salir cuando quiera?<Plus size={16} className="chev" aria-hidden="true" /></summary>
            <p>Sí. Desinstalar el bot te devuelve tu servidor tal cual estaba: la configuración vive donde corrió siempre, en tu propia instancia.</p>
          </details>
        </section>
      </main>

      <div className="closing">
        <div className="inner">
          <div className="closing-copy">
            <span className="kicker">Empezar</span>
            <h2>Pon tu servidor en orden.</h2>
            <p>Gratis, sin tarjeta. Se instala en menos de un minuto y se configura desde el panel.</p>
            <a className="btn btn-primary" href={ctaHref}>Añadir a Discord<ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <ul className="closing-list">
            <li>
              <ShieldCheck size={20} aria-hidden="true" />
              <span><span className="m">Automod</span><br /><span className="d">Filtra spam, enlaces y menciones.</span></span>
            </li>
            <li>
              <Radar size={20} aria-hidden="true" />
              <span><span className="m">Honeypot</span><br /><span className="d">Atrae raids y expulsa intrusos.</span></span>
            </li>
            <li>
              <ShieldAlert size={20} aria-hidden="true" />
              <span><span className="m">Anti-nuke</span><br /><span className="d">Bloquea acciones masivas.</span></span>
            </li>
            <li>
              <Ticket size={20} aria-hidden="true" />
              <span><span className="m">Tickets</span><br /><span className="d">Atención en privado para tu gente.</span></span>
            </li>
          </ul>
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
