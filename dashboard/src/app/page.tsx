import Link from 'next/link';
import { ArrowRight, Plus, ShieldAlert } from 'lucide-react';
import { inviteUrl } from '@/lib/discord';
import SoundToggle from '@/components/SoundToggle';

const AUTH_MESSAGES: Record<string, string> = {
  denied: 'Cancelaste el inicio de sesión en Discord. Puedes volver a intentarlo cuando quieras.',
  state: 'La sesión de inicio caducó. Vuelve a intentarlo.',
  error: 'Discord no pudo completar el inicio de sesión. Inténtalo de nuevo.',
  config: 'El panel aún no tiene credenciales OAuth configuradas (DISCORD_CLIENT_ID / DISCORD_REDIRECT_URI).',
};

const FEATURES = [
  { n: '01', name: 'Moderación con registro', line: 'Ban, kick, warn, lockdown y purge con registro en el canal que elijas.', cmd: '/ban' },
  { n: '02', name: 'Automod contextual', line: 'Invites, enlaces con lista blanca, spam por frecuencia o duplicado, menciones, mayúsculas y palabras por límite de palabra.', cmd: '/automod' },
  { n: '03', name: 'Honeypot rotativo', line: 'Un canal señuelo cuyo nombre rota entre intervalos de 20 minutos a 7 días: la cuenta de raid que publica ahí queda sancionada al instante.', cmd: '/honeypot' },
  { n: '04', name: 'Anti-nuke sobre audit log', line: 'Vigila borrados de canales y roles, baneos, webhooks y permisos en ventanas de 1 a 120 minutos. Responde con registro, derank o ban.', cmd: '/antinuke' },
  { n: '05', name: 'Tickets con transcripción', line: 'Panel con hasta 4 categorías, roles de soporte y archivo del historial al cerrar.', cmd: '/ticket' },
  { n: '06', name: 'Niveles y roles por rango', line: 'XP por mensaje con cooldown configurable, canales excluidos y entrega automática de roles al subir.', cmd: '/level' },
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
            <span className="kicker">548 comandos · slash y prefijo</span>
            <h1>Tu servidor, <em>en orden</em> antes de que arda.</h1>
            <p className="lede">
              Bot de Discord en español con panel web para configurar automod, honeypot,
              anti-nuke, tickets, niveles, autorole, bienvenidas, música y registros{' '}
              <b>con tu cuenta de Discord, sin memorizar comandos</b>.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href={ctaHref}>Añadir a Discord</a>
              <Link className="btn btn-ghost" href="/dashboard">Abrir el panel</Link>
            </div>
            <p className="micro">
              <span>OAuth oficial de Discord</span>
              <span>Solo servidores que administras</span>
            </p>
          </div>

          <figure className="portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/danica.jpg" alt="Danica, guardiana del orden de Deyra" width={300} height={300} fetchPriority="high" />
            <span className="portrait-seal" aria-hidden="true">D</span>
          </figure>
        </section>

        <div className="spec-strip" aria-label="Ficha técnica">
          <span><b>548</b> comandos</span>
          <span><b>10</b> módulos en el panel</span>
          <span><b>7</b> filtros de automod</span>
          <span><b>3</b> respuestas anti-nuke</span>
        </div>

        <section className="section" id="servicio" aria-label="Lo que hace">
          <span className="kicker">El servicio</span>
          <h2 className="section-title">Seis sistemas activos desde el primer minuto.</h2>
          <p className="section-sub">Cada fila corresponde a un módulo real del bot y a una sección del panel.</p>

          <div className="feature-grid">
            {FEATURES.map(({ n, name, line, cmd }) => (
              <a key={n} className="feature-card" href="#panel">
                <span className="feature-n" aria-hidden="true">{n}</span>
                <span className="feature-name">{name}</span>
                <span className="feature-desc">{line}</span>
                <code className="feature-cmd">{cmd}</code>
              </a>
            ))}
          </div>
        </section>

        <section className="section" id="panel" aria-label="El panel">
          <span className="kicker">El panel</span>
          <h2 className="section-title">La misma configuración que leen los comandos.</h2>
          <p className="section-sub">
            Cuando sellas un cambio en la web, el bot lo aplica sobre la marcha: sin
            reinicios, sin sintaxis de flags y sin pegar IDs de canales o roles a mano.
          </p>
          <ul className="panel-list">
            <li><span className="n" aria-hidden="true">01</span><span><b>Acceso por permisos reales.</b> Solo aparecen los servidores donde tienes Administrador o Gestionar servidor y Deyra está dentro.</span></li>
            <li><span className="n" aria-hidden="true">02</span><span><b>Validación idéntica al bot.</b> Rangos, listas blancas y canales pasan por el mismo esquema que los comandos.</span></li>
            <li><span className="n" aria-hidden="true">03</span><span><b>Selectores en vivo.</b> Lee los canales de texto, voz, categorías y roles actuales del servidor en cada carga.</span></li>
          </ul>
          <Link className="btn btn-ghost panel-cta" href="/dashboard">
            Ver archivo del panel <ArrowRight size={15} aria-hidden="true" />
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
            <p>Invita a Deyra con permisos de moderación y abre el panel con tu cuenta de Discord para sellar la configuración inicial.</p>
            <a className="btn btn-primary" href={ctaHref}>Añadir a Discord<ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <ul className="closing-list">
            <li>
              <span className="n" aria-hidden="true">01</span>
              <span><span className="m">Automod</span><br /><span className="d">7 filtros con lista blanca de dominios y escalada a 30 días.</span></span>
            </li>
            <li>
              <span className="n" aria-hidden="true">02</span>
              <span><span className="m">Honeypot</span><br /><span className="d">Canal señuelo con rotación automática y sanción inmediata.</span></span>
            </li>
            <li>
              <span className="n" aria-hidden="true">03</span>
              <span><span className="m">Anti-nuke</span><br /><span className="d">Umbral de 1 a 20 acciones sobre el audit log.</span></span>
            </li>
            <li>
              <span className="n" aria-hidden="true">04</span>
              <span><span className="m">Tickets y registros</span><br /><span className="d">Soporte por categorías y canales de log separados por tipo.</span></span>
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
