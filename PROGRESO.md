# Deyra — historial de etapas

> La versión actual es la **2.3.0**, que corresponde a la **Etapa 12** (dashboard ampliado, honeypot con auto-creación y rotación),
> al principio de este documento. Abajo está el historial desde la primera.

## Etapa 12 (v2.3.0): dashboard ampliado y honeypot inteligente

**Dashboard (Next.js)** — `dashboard/`:

- Secciones nuevas: **Tickets** (título/descripción del panel, categoría,
  canal de log, roles de soporte), **Niveles** (XP mín/máx, cooldown,
  canal de anuncio, **recompensas por rol** con altas/bajas, canales sin XP),
  **Autorole** (listas separadas para humanos y bots), **Música** (volumen,
  autoplay, fairplay + rol, modo 24/7 con canales de voz/texto, límites),
  y **General** ahora edita canales de sugerencias/confesiones/cumpleaños y
  el modo NSFW del servidor.
- **Temas oscuros conmutables** desde la barra lateral: Jade (default),
  Ámbar, Medianoche y Ciruela. La preferencia persiste en el navegador.
- Animaciones y micro-interacciones: entrada de páginas, stagger en tarjetas,
  brillo en el CTA, pops en listas y toasts. Respetan `prefers-reduced-motion`.
- Fix de overflow horizontal en móvil y favicon/logo propios (retrato de
  Deyra) — la web respira el icono del bot.

**Honeypot inteligente**:

- **Auto-creación del canal señuelo** al activarlo sin canal asignado: se
  crea con un nombre señuelo aleatorio y topic de «solo lectura». También
  desde `/honeypot toggle activo:true`.
- **Rotación automática del nombre** del canal señuelo cada N horas
  (`/honeypot rotate <horas>`, 0–168; dashboard incluido) para que los bots
  de raid no memoricen el patrón. Topic también rota. Corre en backgroundJobs.
- **Auto-purge** (`/honeypot autopurge`): borra los mensajes recientes de
  quien cae en el señuelo.
- **`/honeypot stats`**: contador público de cuentas atrapadas
  (`caughtCount`), última rotación, estado de purge/rotación.
- Nuevas columnas: `autoPurge`, `rotationHours`, `caughtCount`,
  `lastRotationAt` (auto-migración aditiva al arrancar).

**Deploy**:

- Bot en bot-hosting.net desde GitHub (auto-pull en restart). Dashboard en
  Vercel como app Next.js con OAuth de Discord. Dominio público del bot en
  `deyra.apps.bot-hosting.cloud` (la API admin autentica con Bearer y está
  restringida por CORS a `DASHBOARD_ORIGIN`).

## Etapa 11 (v2.2.0): seguridad avanzada y dashboard web

**Honeypot (canal señuelo)** — `src/gateway/honeypot/`, comando `/honeypot`:

- `setup` crea el canal señuelo (nombre configurable) y activa la trampa;
  `channel` usa un canal existente; `toggle`, `action` (timeout/kick/ban),
  `disable` y `status` completan el comando.
- Cualquier cuenta (humana o bot) que escriba ahí: se borra el mensaje, se
  aplica el castigo configurado y se registra en el canal de logs de
  moderación. El dueño y quienes tienen ManageGuild nunca son castigados.

**Anti-nuke** — `src/gateway/antinuke/`, comando `/antinuke`:

- Vigila el audit log (`guildAuditLogEntryCreate`): borrado de
  canales/roles, baneos masivos, webhooks, bots añadidos y cambios de
  permisos de rol. Hay una ventana por autor; al pasar el umbral se aplica
  la acción configurada: `ban`, `derank` (quitar todos los roles) o `log`
  (solo observación).
- Whitelist por usuario/rol, umbral y ventana configurables. Nunca toca al
  dueño ni a otros bots.

**Automod mejorado** — `src/gateway/automod/automodEvents.js`:

- Invita-detección ampliada (discord.com/invite, dsc.gg, invite.gg).
- antiLink con **allowlist de dominios** (`/automod allowlink`).
- Menciones cuentan usuarios + roles + @everyone/@here.
- Palabras prohibidas con **límites de palabra** (menos falsos positivos).
- Spam: el tracker en memoria se purga (sin crecimiento infinito) y además
  detecta **contenido duplicado** (mismo mensaje repetido = raid).
- Escaneo también en **mensajes editados**.
- **Escalada automática**: toda infracción queda en `Warn`; al llegar a N
  infracciones en 30 días (configurable), se aplica `timeout` 1h, `kick` o
  `ban` (`/automod escalation`).
- `punishmentAction` acepta `ban`.

**Registros en canales de logs (columnas que existían muertas)** —
`src/gateway/logging/`:

- `messageDelete`/`messageUpdate` → canal `messageLogChannelId`.
- `guildMemberAdd`/`guildMemberRemove` → canal `memberLogChannelId`.
- Config cacheada 60s + supresión de ráfagas (máx 12 registros/30s, con
  resumen) para que un purge no spamee el canal.
- Comandos nuevos: `/config memberlog` y `/config messagelog`.

**Incompletos resueltos** — `playerSkip` era código muerto (kazagumo nunca lo
emitía) y se eliminó; `playerResumed` (que sí emite) ahora actualiza el
status de voz y marca el momento en el player. `npm run deploy:commands`
apuntaba a un archivo inexistente: ahora usa `scripts/deployCommands.js`
(registra sin arrancar el bot; `--dry-run` incluido). Se creó el
`.env.example` que el README referenciaba y no existía.

**API admin + dashboard web** — `src/admin/server.js` y `dashboard/`:

- API HTTP mínima embebida en el bot (Bearer + comparación en tiempo
  constante, CORS restringido con `DASHBOARD_ORIGIN`, rate limit por IP,
  body máx 64 KB, validación estricta de campos). Sin `ADMIN_API_KEY` no
  arranca (fail-closed).
- `dashboard/` es una app Next.js para Vercel con login Discord OAuth
  (identify + guilds): solo admins ven el panel; elige servidor, edita
  automod/honeypot/anti-nuke/bienvenida/registros/ajustes generales con
  cambios en vivo sobre la DB del bot.

**Migración obligatoria**: `npm run db:migrate` (agrega `linkAllowlist`,
`escalationAction`, `escalationThreshold` a `automod_configs`). Las tablas
`honeypot_configs` y `antinuke_configs` se crean solas.

## Etapa 9 — música (historial previo)

## Qué se hizo en esta etapa

Se integró un módulo de música completo (Lavalink vía Kazagumo/Shoukaku) traído
de tu bot Valk, traducido al español y rediseñado con el estilo visual de Deyra
(Components V2 + tu paleta de colores + tus iconos custom).

**34 comandos de música nuevos**, todos con descripción, funcionan como slash
(`/play`) y como prefijo (`!play`) a la vez:

`play`, `search`, `queue`, `nowplaying`, `skip`, `skipto`, `previous`,
`forceskip`, `stop`, `leave`, `join`, `move`, `pause`, `resume`, `replay`,
`seek`, `rewind`, `forward`, `speed`, `volume`, `loop`, `queueshuffle`,
`remove`, `clearqueue`, `leavecleanup`, `autoplay`, `history`, `grab`,
`lyrics`, `similar`, `mood`, `artistradio`, `sleeptimer`, `forcefix`.

## Cómo probarlo

```bash
cd deyra_build
npm install
cp .env.example .env
```

Editá `.env` y completá al menos `BOT_TOKEN` y `CLIENT_ID` (los de tu bot en
el Developer Portal de Discord). La música ya viene lista para funcionar con
un nodo Lavalink público de prueba — para producción real se recomienda un
nodo propio, más estable (lo dejo anotado en el `.env.example`).

```bash
npm run deploy:commands   # registra los slash commands en Discord
npm start
```

## Conflictos de nombre resueltos (Deyra vs Valk)

Deyra ya tenía comandos con estos nombres para otra cosa. Para no perder
ninguna de las dos funciones, el comando de **música** se renombró:

| Nombre original (Valk) | Qué hacía en Deyra | Nuevo nombre (música) |
|---|---|---|
| `/shuffle` | Mezclar una lista (utilidad) | `/queueshuffle` |
| `/sleep` | Comando social "irse a dormir" | `/sleeptimer` |

## Verificación hecha

- Sintaxis de los 34 comandos: **OK** (chequeado con `node --check`).
- Arranque completo del bot: **OK**, sin errores.
  - Antes: 408 slash / 666 prefijo.
  - Ahora: **442 slash / 731 prefijo** (con la música integrada).
- Config de música: nodo Lavalink público cargando correctamente.

## Etapa 2: Comandos de imágenes (pfpboy, pfpgirl, anime)

Se agregaron 3 comandos de galería de imágenes, con navegación por botones
(primera/anterior/siguiente/última página), usando las listas curadas que
ya tenías en Valk (`src/assets/pfps/*.json`):

- `/pfpboy` (alias `pfpmale`, `boypfp`) — 1099 fotos de perfil de chicos.
- `/pfpgirl` (alias `pfpfemale`, `girlpfp`) — 1010 fotos de perfil de chicas.
- `/anime` (alias `pfpanime`, `animepfp`) — 944 fotos de perfil de anime.

**Sobre `/emo`:** no lo agregué. No existe una lista curada tuya para esa
categoría, y tampoco hay ninguna API pública real que la ofrezca (waifu.pics,
la más usada para este tipo de bots, solo tiene `waifu`/`neko`/`shinobu`/
`megumin` y reacciones — nada de "emo"). Decidiste dejarlo afuera antes que
usar una mezcla genérica o contenido sin curar. Si más adelante conseguís una
lista de URLs para esa categoría, se agrega en cinco minutos con el mismo
patrón que los otros tres.

Se portó también el helper de paginación genérico (`src/lib/pagination.js`),
así que agregar una cuarta categoría en el futuro es trivial.

## Etapa 3: Animales

Deyra ya tenía `/cat`, `/dog`, `/duck`, `/bird`, `/redpanda`, `/panda` y
`/fox`, cada uno con su propia API en vivo (cataas, dog.ceo, random-d.uk,
randomfox, some-random-api) — no se tocaron.

Se agregaron los que faltaban, usando tu pool curado de Valk como fuente
(con fallback a búsqueda en vivo si algún día se vacía esa categoría):

`/bear`, `/sheep`, `/squirrel`, `/snake`, `/pig`, `/bunny`, `/possum`,
y `/animalfact` (dato curioso al azar con foto, usando some-random-api).

## Etapa 4: Conversión

Deyra ya tenía **base32** (decimal→base32), **hex** (encode/decode con
choices), **kg**/**lbs**, y **rot13** — todos mejor implementados que los
equivalentes de Valk, así que no se tocaron.

Se agregaron los 10 que faltaban: `/cm`, `/ft` (cm↔pies y pulgadas, Deyra
solo tenía metros↔pies), `/dechex`, `/hexdec`, `/binint`, `/intbin`,
`/binstr`, `/strbin`, `/ascii85`, `/encode`.

**Bug corregido al portar:** el `/encode` original de Valk tenía un error
real — el modo `b32` devolvía Base64 en lugar de Base32. Se corrigió para
usar el algoritmo de Base32 correcto (verificado: `encode(hello, b32)` da
`NBSWY3DP`, el valor estándar real).

## Etapa 5: Dump (moderación / backup)

Se agregaron los 12 comandos de exportación de datos del servidor, todos
en español, respetando el mismo comportamiento de seguridad del original:
verifican el permiso correspondiente y **envían el archivo por DM privado**
a quien ejecuta el comando (nunca se postea en el canal).

`/dumpbans`, `/dumpbots`, `/dumphumans`, `/dumpusers`, `/dumproles`,
`/dumpchannels`, `/dumpvoicechannels`, `/dumpcategories`, `/dumpemotes`,
`/dumpsettings`, `/dumpmessages` (con canal y cantidad configurables),
`/dumpwarns`.

**Adaptación importante:** el `/dumpwarns` original de Valk consultaba
PostgreSQL directo. Se migró para usar el modelo `Warn` (Sequelize/SQLite)
que Deyra ya tenía, en vez de duplicar una conexión de base de datos nueva.

## Lo que sigue

- Pulido final de diseño visual en el resto de comandos existentes de Deyra
  (los 511 originales, que ya usan Components V2 pero se pueden afinar más).
- Subir los emojis custom con `npm run emojis:upload` (requiere el bot ya
  desplegado con su token real).

## Etapa 6: /help mejorado + color global

**Color:** se cambió `config.COLORS.PRIMARY` de `#2B7FFF` (azul brillante) a
`#1E3A5F` (azul acero oscuro). Como todos los paneles del bot usan ese mismo
valor centralizado, el cambio se aplicó automáticamente a los 475 comandos
sin tocar cada uno.

**`/help` reescrito:**
- Ya funcionaba en slash y prefijo (`/help`, `!help`, `!ayuda`, `!comandos`)
  — eso ya estaba, no era necesario agregarlo.
- Lo que faltaba y se agregó: cada comando ahora muestra su **mini
  descripción real** (la misma que ve el usuario en el autocompletado de
  Discord), no solo el nombre pelado.
- Paginación con botones (◀ Anterior / Siguiente ▶) para categorías grandes
  — utilidad tiene 219 comandos, 19 páginas de a 12; antes se mostraban
  todos los nombres separados por coma en un bloque ilegible.
- Acceso directo: `/help categoria:música` o `!help música` salta
  directamente a esa categoría sin pasar por el menú.
- Se agregó la categoría "🎵 Música" a las etiquetas (le faltaba desde que
  se fusionó el módulo de música).

Verificado con los 475 comandos reales cargados: cada página respeta el
límite de caracteres de Discord y la paginación no se rompe en los casos
límite (categoría de una sola página, página fuera de rango).

## Etapa 7: /ping arreglado, /purge mejorado, bienvenida al unirse el bot

**`/ping` — bug corregido.** El comando enviaba un mensaje de texto plano
("Calculando...") y después intentaba editarlo a un panel Components V2 sin
limpiar el `content` viejo. Discord rechaza esa mezcla (un mensaje con el
flag `IsComponentsV2` no puede tener `content`), así que el `.edit()` fallaba
silenciosamente y el comando no respondía. Se reescribió para enviar el
panel final directo, sin el paso intermedio de texto plano.

**`/mod purge` — mejorado** (ya existía, con tope de 100 y solo filtro por
usuario):
- Tope subido a **500** mensajes, purgando en lotes de 100 (límite real de
  la API de Discord por request) hasta llegar a la cantidad pedida.
- Nuevo filtro `solo_bots`: borra únicamente mensajes enviados por bots.
- Nuevo filtro `solo_comandos`: borra únicamente invocaciones de comando
  (mensajes que empiezan con el prefijo del bot, o respuestas de slash
  commands), útil para limpiar el "ruido" de comandos usados en un canal.
- Combinable con el filtro de usuario existente (ej: `usuario:@ese-bot
  solo_comandos:true` para limpiar solo los comandos de un bot puntual).
- Avisa si se cortó antes de lo pedido por la regla de Discord que impide
  borrar en lote mensajes de más de 14 días.

**Bienvenida al unirse el bot a un servidor (`guildCreate`) — nueva.**
Cuando Deyra entra a un servidor, manda automáticamente un panel al primer
canal donde pueda escribir (el canal de sistema si tiene permiso, si no el
primer canal de texto disponible):
- Selector de idioma con banderas: Español, English, Deutsch, Français,
  Português (BR), Русский — los mismos locales que soporta la propia API de
  Discord, elegidos por ser los más usados en la plataforma.
- El panel explica qué trae el bot (moderación, música, economía, niveles,
  tickets, bienvenidas) con los emojis propios de Deyra, no emojis genéricos.
- Al elegir un idioma, el panel se actualiza en el momento sin crear un
  mensaje nuevo, y la preferencia queda guardada en `GuildConfig.language`
  por servidor (columna nueva).
- El idioma inicial se adivina por el `preferredLocale` que reporta Discord
  para ese servidor, con español como default si no matchea ninguno.

**Importante si ya tenés el bot corriendo en producción:** el modelo
`GuildConfig` tiene una columna nueva (`language`). Sequelize no altera
columnas de tablas ya existentes por defecto (por seguridad, no toca datos
reales solo). En un despliegue nuevo no hay que hacer nada — se crea sola.
Si ya tenés datos, corré una vez esto antes de arrancar el bot:
```js
node -e "require('dotenv').config(); require('./src/data/models').dbReady.then(() => require('./src/data/sequelize').getQueryInterface().addColumn('guild_configs', 'language', { type: require('sequelize').DataTypes.STRING, defaultValue: 'es' })).then(() => process.exit(0))"

---

# Etapa 8: sistema de diseño, endpoints y comandos nuevos

La etapa más grande hasta ahora. Tres cosas separadas que se hicieron juntas
porque se refuerzan: **cómo se ve el bot**, **de dónde saca los datos**, y
**qué comandos tiene**.

## El problema de fondo

`src/lib/panel.js` era un constructor de 40 líneas: `## título`, una descripción
y un bloque de líneas markdown sueltas. Los 58 archivos que armaban Containers a
mano cada uno con su propio ritmo de separadores, y `**Clave:** valor` repetido
vece veces seguido se leía como un muro de texto. No había pie de marca, ni
avatar, ni forma de alinear columnas, ni barras de progreso.

Y mientras se revisaba eso aparecieron **tres bugs reales**, que no eran de
estilo sino de fonctionnement:

1. **Todos los GIFs estaban caídos.** `animeGifApi.js` usaba `fetch()` pelado.
   nekos.best —el proveedor PRINCIPAL— responde `403 "blocked for using a missing
   or invalid User-Agent"`. En la práctica, `/hug`, `/kiss`, `/slap` y los otros
   30 comandos sociales no funcionaban; solo respondía el respaldo.
2. **El segundo proveedor estaba muerto.** `api.waifu.pics` ya no resuelve, y
   `waifu.pics` fue capturado por un sitio de casino. Un proveedor que devuelve
   contenido de otro es peor que uno caído.
3. **La selección de slash commands era inestable.** Dependía del orden en que
   se leían los archivos, así que el hash cambiaba en cada deploy y el bot
   re-registraba los 90 comandos sin motivo (y el registro global tarda 1 hora).

## 8.1 — Sistema de diseño (`src/lib/ui/`)

Siete módulos. La idea: un comando declara **qué** quiere mostrar, no **cómo** se
ve; el tema decide el color, la tipografía y el ritmo.

| Archivo | Qué hace |
|---|---|
| `theme.js` | Tokens: un color de acento por categoría, tonos semánticos, íconos, marca |
| `text.js` | Grillas alineadas, tarjetas, barras, pills, sparklines, formato de números |
| `panel.js` | Constructor de paneles. Parte en varios Containers si no entra en uno |
| `states.js` | Error, vacío, cooldown, permisos, cargando. Todos efímeros por defecto |
| `imagePanel.js` | Paneles con imagen: créditos, autor, paginación, spoiler |
| `sanitize.js` | Neutraliza `@everyone`, balancea markdown, filtra URLs |
| `showcase.js` | Muestras de cada bloque, para verlas sin Discord |

### El detalle que hace que las tablas se vean derechas

Discord dibuja el texto normal en una fuente **proporcional**. Alinear con
espacios fuera de un bloque de código no funciona: la línea de puntos o la barra
se ve torcida. Dentro de un bloque de código sí es monoespaciado.

`text.js` mide el ancho real de cada cadena —incluyendo emojis y CJK, que ocupan
dos columnas— y alinea ahí adentro. Por eso las grillas quedan derechas
también con acentos, con chino o con 300 emojis en una celda.

### Lo que gana cada comando

Sin tocar **ninguno** de los 626 comandos, todos los paneles que usaban
`panel.js` pasaron a tener: jerarquía consistente, color según categoría, pie de
marca, recorte a los límites reales de Discord, y errors que son efímeros y
dicen qué hacer.

Después se migraron a mano los que más se ven: `serverinfo`, `userinfo`,
`botinfo`, `ping`, `help`, `embed`, `level rank`, `level leaderboard`,
`economy balance`, y todo el módulo social.

`serverinfo` es el ejemplo de la diferencia:

```
ANTES                              AHORA
──────────────────────────         ┌──────────┬──────────┐
**Nombre:** Deyraland              │ 👥 1.284 │ 💬 51    │
**ID:** 118455556677889900         │ Miembros │ Canales  │
**Dueño:** Ryu#0001                └──────────┴──────────┘
**Creado:** 19/08/2024             ┌──────────┬──────────┐
**Miembros:** 1284                 │ 🎭 24    │ 🚀 14    │
**Canales de texto:** 42           │ Roles    │ Boosts   │
...10 líneas más                  └──────────┴──────────┘
```

### `/showdesign`

Comando de owner que muestra cada bloque con datos de ejemplo, para revisar el
tema después de tocarlo sin tener que disparar 20 comandos distintos.

## 8.2 — Capa de red (`src/lib/http.js` + `src/lib/providers.js`)

**`http.js`**: User-Agent correcto, timeout, reintentos con backoff, y cache con
`stale-if-error` (si el proveedor está caído pero hay copia en caché, se sirve
esa en vez de un error).

**`providers.js`**: cadena de respaldo con circuit breaker. El proveedor que
falla 3 veces queda en cuarentena 5 minutos, para no sumarle 12 segundos de
espera a cada comando. `/botinfo` muestra el estado de todos.

### El User-Agent: el detalle que define si los GIFs funcionan

nekos.best exige el formato `NOMBRE (CONTACTO)` y rechaza:

| User-Agent | Resultado |
|---|---|
| Sin User-Agent | ❌ 403 |
| `Mozilla/5.0 … Chrome/126` (hacerse pasar por navegador) | ❌ 403 |
| `DeyraBot (https://example.com)` (relleno) | ❌ 403 |
| `DeyraBot (ryu@example.com)` (email) | ❌ 403 |
| `DeyraBot (https://github.com/ryu/deyra)` | ✅ 200 |

Las tres primeras cosas eran el bug. Por eso `HTTP_CONTACT` es la variable más
importante del `.env` después del token, y está documentada como tal.

## 8.3 — Endpoints y comandos nuevos

### GIFs: de 34 a 67 acciones

El catálogo real de nekos.best v2 son **65 categorías de GIF** (tomadas de las
constantes de su librería oficial) más **4 imágenes de personaje**. Antes se
usaban 34 con nombres inventados; ahora cada comando apunta a una categoría que
existe de verdad, y hay 67 acciones (las que además de las 65 tienen sentido como
comando).

Agregar una acción es **una línea + un comando**:

```bash
# 1. Una entrada en src/lib/socialActions.js
spin: { do: 'Girá', emoji: '🌀', solo: true, gif: 'spin' },

# 2. Y nada más:
npm run gif:generate
```

Sin código repetido: los 67 archivos de comando son 15 líneas cada uno y
delegan en `socialExecutor`.

**`/gif <texto>`** busca por palabras y entiende español con un diccionario de
sinónimos: `/gif abrazos` → hug, `/gif cosquillas` → tickle, `/gif hola` → wave.
Si no reconoce, sugiere categorías con botones en vez de decir "no encontré".

### 8 imágenes de personaje

`/waifu` `/neko` `/kitsune` `/husbando` `/shiro` `/senko` `/okami` `/holo`, con
**autor y link a la obra original** (nekos.best los devuelve para estas
categorías, no para los GIFs de rol).

### 17 comandos de contenido

Todos con API verificada, sin key, y con proveedor de respaldo cuando hay
alternativa:

| Comando | Fuente |
|---|---|
| `/animeinfo` | MyAnimeList (Jikan) |
| `/book` | Open Library |
| `/tvshow` | TVmaze, con respaldo en iTunes |
| `/meal` | TheMealDB |
| `/brewery` | Open Brewery DB |
| `/freegames` | GamePower |
| `/xkcd` | xkcd oficial |
| `/memetemplate` | imgflip (catálogo real de 200+ plantillas) |
| `/catmeme` | cataas |
| `/avatar` | DiceBear, 16 estilos |
| `/urban` | Urban Dictionary |
| `/chuckjoke` | Chuck Norris API |
| `/song` | Deezer |
| `/steamgame` | SteamSpy |
| `/iss` | Open Notify |
| `/ghsearch` | GitHub Search |
| `/nsfw` | — (política del servidor) |

**Un bug encontrado probando:** la URL de xkcd no es `xkcd.com/350.0.json` (404)
sino `xkcd.com/350/info.0.json`. Está anotado en el código porque es
contra-intuitivo y va a volver a pasar.

### Política de contenido

`/nsfw` (solo **Gestionar servidor**), aplicado de forma centralizada en
`contentPolicy.js`. Hoy **no habilita nada visible**: las 73 categorías que usa
el bot son SFW. Está implementado igual para que, cuando se conecte una fuente
adulta, sea una decisión consciente de quien administra el servidor y no un
descuido de código.

## 8.4 — Registro de slash commands

Tres cambios en `registerCommands.js`:

- **Estabilidad**: el orden dentro de la categoría ahora es alfabético. Antes
  dependía del orden de lectura de archivos, así que el hash cambiaba en cada
  deploy.
- **Reparto por turnos**: en vez de llenar los 90 cupos por prioridad pura
  (utilidad tiene 221 comandos y se los llevaba todos), se reparan por rondas
  entre las nueve categorías, con tope de 20 por categoría.

  Antes: 89 de 90 eran utilidad, y moderación/música/economía no aparecían.
  Ahora: 18 utilidad, 12 diversión, 11 moderación, 11 economía, 11 música, 11
  configuración, 11 owner, 3 niveles, 2 tickets.
- **Pinned**: siete comandos entran sí o sí (`help`, `serverinfo`, `ping`…),
  porque son los que la gente busca por nombre en el menú `/`.

## 8.5 — Migraciones

`npm run db:migrate`. Sequelize no altera tablas existentes (por diseño), así
que agregar columnas requiere hacerlo a mano en instalaciones viejas. El script
compara modelos contra la base real y agrega solo lo que falta. Es idempotente.

## 8.6 — Verificación

Cinco scripts. Los que corren sin internet son los que se ejecutan en cada deploy:

| Script | Qué cubre |
|---|---|
| `verify:ui` | 42 casos del sistema de diseño contra los límites de Discord |
| `verify:panels` | 41 casos: comandos migrados + contenido hostil (20k chars, markdown roto, `javascript:` en URL, 25 imágenes, `@everyone`) |
| `verify:commands` | 750 archivos cargan, 533 comandos válidos, sin colisiones, categorías de GIF existen |
| `verify:slash` | Que la selección de slash sea estable entre dos cargas |
| `verify:docs` | Que el README no mienta (comandos y conteos) |
| `verify:providers` | Las APIs externas de verdad + la capa HTTP |

Más `npm run preview` para ver el diseño en la terminal.

---

## Números

| | Antes | Ahora |
|---|---|---|
| Slash commands | 519 | **533** |
| Entradas de prefijo | 869 | **888** |
| Comandos efectivos | 612 | **626** |
| Comandos que se registran como `/` | 90 (89 de utilidad) | **90 (18 de 9 categorías)** |
| Acciones sociales | 34 | **67** |
| Categorías de GIF reales | 34 (inventadas) | **65** + 4 personajes |
| Imágenes de personaje | 0 | **8** |
| Comandos de contenido nuevos | 0 | **17** |
| APIs con respaldo verificado | 1 | **17** |
| Módulos del sistema de diseño | 0 | **7** |
| Scripts de verificación | 0 | **6** |

## Para la próxima (antes de la etapa 9)

- Migrar los 58 archivos que todavía arman Containers a mano al sistema nuevo
  (ya usan los mismos bloques, pero les falta la jerarquía y el pie).
- `/gif` con búsqueda real: hoy mapea palabras a las 65 categorías. Con una key
  de Giphy o Tenor en el `.env` podría buscar cualquier cosa.
- Los 8 comandos de dumps (12 en total) se podrían agrupar en subcomandos, que es
  más limpio que 12 comandos sueltos.
```

---

## Etapa 9 — Fusión con el bot de música de once

El módulo de música venía de un bot de música completo en TypeScript (Kazagumo
no: usaba Shoukaku directo, PostgreSQL, Redis, hybrid sharding, premium y
listas). La idea era traer lo que faltaba sin romper lo que ya andaba.

### Decisiones

| Pregunta | Decisión | Por qué |
|---|---|---|
| ¿Qué motor de música? | **Kazagumo, el de siempre** | El otro traía su propio wrapper de player (718 líneas) con locks, rollback de transiciones y rehidratación. Portarlo a un motor distinto, encima, era cambiar lo que funciona para ganar features que se pueden portar sueltas. |
| ¿La base de datos? | **El SQLite que ya había** (8 modelos Sequelize) | El otro usaba PostgreSQL + Redis. Traer eso significa que para reproducir música el bot necesita dos servicios más, en un host donde Lavalink ya va aparte por RAM. Mismo criterio que en la Etapa 5 con `/dumpwarns`. |
| ¿El nombre? | **Deyra sigue siendo Deyra** | Ryu es el owner, no el bot. |
| ¿Los créditos del otro? | **En `/credits`, `NOTICE.md` y el README** | Su licencia (`OUSL-1.0`, copyleft) exige atribución. Fuera de Discord no se ve nada del proyecto original. |

### Lo que entró

- **`/filter`** con 11 presets (bassboost, nightcore, vaporwave, pop, rock,
  electronic, lofi, trap, 8d, soft, treble) y reaplicado automático en cada
  canción, porque Lavalink no arrastra los filtros entre pistas.
- **Biblioteca persistente**: `/favourite`, `/favourites`, `/playlist` (9
  subcomandos), `/history`. El historial antes vivía en la memoria del player:
  se perdía en cada `/stop` y en cada reinicio.
- **`/twentyfourseven`** + `/musicconfig` (volumen, autoplay, fairplay, rol,
  24/7, reset) + un job de 15 minutos que revive el 24/7 si el bot se reinició.
- **`/premium`, `/vote`, `/premiumadd`** y el receptor de webhooks de top.gg
  (`node:http`, HMAC con comparación por tiempo constante, sin dependencias
  nuevas).
- **Panel de reproducción con controles persistentes**: barra que avanza sola,
  volumen, loop, autoplay y filtros desde el mensaje.

### Bugs que aparecieron al integrar

| Bug | Dónde | Qué pasaba |
|---|---|---|
| `playerUpdate` era un stub vacío | `src/music/events/playerUpdate.js` | Nadie refrescaba la posición. Ahora edita el panel cada 5 s como máximo: Lavalink manda el evento varias veces por segundo y a esa frecuencia Discord devuelve 429 al canal entero. |
| `player.data.stay247` se leía pero nadie lo escribía | `playerEmpty.js` | El modo 24/7 era inalcanzable. |
| `config.MUSIC.MAX_QUEUE_SIZE` y `LEAVE_ON_EMPTY_MS` sin usar | `src/config.js` | Declarados y nunca leídos. Ahora los usa la config por servidor. |
| `/nowplaying` con la barra rota | `nowplaying.js` | El ternario de las dos ramas daba el mismo resultado: la barra nunca se llenaba. |
| Doble autoplay | `playerStart.js` / `musicHandler.js` | Lavalink tiene autoplay propio y el bot otro más. Con los dos prendidos, Lavalink reinicia la pista, el bot agrega otra y quedan dos sonando. Ahora el de Lavalink se apaga explícitamente. |
| Paneles con botones que morían | varios | Cada comando montaba su `createMessageComponentCollector` con 5-15 min de vida, y cerraba sobre el player de ese momento: dos paneles con el mismo `customId` podían actuar sobre reproductores distintos. Ahora hay un dispatcher (`musicHandler.js`). |
| `verify:docs` no verificaba los conteos | `scripts/verifyDocs.js` | La lista de regex estaba definida y nunca se iteraba, así que el README decía "533 comandos" y pasaba igual. Al activarlo aparecieron 3 números falsos, uno de ellos "73 categorías de GIF" cuando son 65. |
| Botón de reproducción mezclando unidades | `playerPanel.js` | La barra comparaba la posición en segundos contra la duración en milisegundos: "42000/217000 11:40:00 / 3:37". |

### Conflictos de nombres con lo que ya tenía

| Del bot viejo | Deyra ya tenía | Quedó como |
|---|---|---|
| `/shuffle` (cola) | `/shuffle` (mezclar texto) | `/queueshuffle` — precedente de la Etapa 1 |
| `/history` | `/history` (historial de música) | `/history`, ahora persistente |
| `/favourites` | — | `/favourites` (alias `favoritos`, `guardados`) |
| `/nowplaying`, `/loop`, `/volume`, `/seek`, `/play` | iguales | Se conservó la versión de Deyra, que ya tenía Kazagumo y mejores mensajes de error |

### Lo que NO se trajo, y por qué

- **PostgreSQL, Redis y el hybrid sharding**: el bot no crece a esa escala en un
  host de 256 MB, y meterlos cambia la operación entera por una función que acá
  no se necesita.
- **Reordenamiento round-robin de la cola por petición (fairplay del viejo)**: en
  ese bot pasaba todo por un objeto `Queue` propio. Con Kazagumo la cola es un
  `Array` sin un punto único de alta, así que reordenarla bien implicaría tocar
  cada comando de reproducción. Se conserved el control de acceso (el rol) y la cola
  quedó FIFO.
- **Login de Spotify e importación de playlists**: dependían de una API de
  terceros del autor (`sp-pl-bread.vercel.app`) que ya está caída. Sin eso, la
  importación no se puede portar; el autoplay sí sobrevive porque el de Deyra
  usa mixes de YouTube.
- **`/playlist-ai`, `/addrelated`**: mismo problema con esa API. `/addrelated`
  estaba roto en el original (tenía la URL vacía).
- **Los cuatro comandos de owner que se autoenviaban un POST a `localhost`**:
  eran el banco de pruebas del webhook de pagos, que no existe acá todavía.

### Números

| | Antes | Ahora |
|---|---|---|
| Archivos en `src/` | 745 | **809** |
| Comandos slash | 533 | **546** |
| Entradas de prefijo | 888 | **944** |
| Comandos de música | 34 | **38** |
| Tablas en la base | 21 | **29** |
| Paneles verificados | 69 | **81** |

### Para la próxima

- Migrar los 58 archivos que todavía arman Containers a mano al sistema de
  diseño (esto incluye los comandos de música viejos, que ya migraron al
  panel compartido).
- El sistema de pagos de premium: hoy el premium se da a mano con
  `/premiumadd`. Cuando exista, el webhook de pagos entra por el mismo lugar que
  el de votos (`src/music/lib/voteWebhook.js` es la referencia de cómo validar
  firmas sin meter express).
- Probar el modo 24/7 de verdad: la lógica está escrita y tiene tests de panel,
  pero necesita un bot corriendo con Lavalink para ver el ciclo completo
  (reinicio → revive el player).


---

## Etapa 10 — Errores de producción (permisos, paginación, música y warnings)

Se arreglaron los errores que aparecieron al correr el bot de verdad, con los
logs de consola del servidor.

### 1. La paginación reventaba (`/anime`, `/pfpboy`, `/pfpgirl`, `/level leaderboard`)

```
TypeError: Cannot read properties of undefined (reading 'length')
    at attachButtons (src/lib/pagination.js:89:37)
```

**La causa**: `ContainerBuilder` tiene una propiedad `components` que contiene
sus **hijos**, no el container. `renderContainer()` hacía
`rendered?.components || [rendered]`, así que cuando un comando devolvía UN
container suelto (que es lo que hacen `/anime` y el ranking), la sesión se
quedaba con la lista de **hijos** del container en vez de con el container.
Después `attachButtons()` leía `components.length` de un `TextDisplayBuilder`
(y le daba `undefined`) y, si llegaba a pasarlo, le intentaba meter una
`ActionRow` encima de un texto.

**El arreglo** (`src/lib/pagination.js`):
- `normalizeContainers()` ahora pregunta primero "¿esto es un builder?" (tiene
  `toJSON()`) y recién ahí mira `.components`. Un builder suelto → `[builder]`;
  un array → el array; un payload `{components, flags}` → sus componentes.
- `attachButtons()` maneja containers builders y containers en JSON plano, y
  respeta los dos límites de Discord (10 componentes de primer nivel, 10
  hijos por container): si el último container ya está lleno, la fila de
  botones va en un container nuevo.
- `disableButtons()` ahora recorre los containers (tipo 17) y no solo las
  action rows (tipo 1): antes, al expirar la sesión, los botones que viven
  dentro de un container seguían **clicable** (no se deshabilitaban nunca).

### 2. `Missing Permissions` (50013) en tickets, `/channel nsfw` y `/bannedcount`

Los tres comandos fallaban con el mismo error de la API de Discord
(`50013 Missing Permissions`) y dejaban un stack gigante en la consola. El
problema no era el código, sino que el bot no tenía el permiso en ese
lugar, y el bot no lo decía.

**El arreglo** (`src/lib/permissions.js` + los 3 comandos):
- `missingBotPermissions(guild, channel, perms)` devuelve **qué** permiso falta,
  con su nombre legible (`ManageChannels`, `BanMembers`), y tiene en cuenta los
  **overwrites de la categoría** (que pisan los del servidor).
- Si el member del bot no está en cache, lo pide (`fetchMe`) antes de decir
  que no tiene permiso.
- Cada comando responde con un panel claro:
  - tickets → "Me falta un permiso **ManageChannels** en la categoría de
    tickets" (además avisa si la categoría fue borrada);
  - `/channel nsfw` → "no tengo el permiso **ManageChannels** acá";
  - `/bannedcount` → "no tengo el permiso **BanMembers** en este servidor".

### 3. `/animeinfo` se caía por timeout de Jikan

```
[animeinfo] Error: [jikan] timeout de 10000ms (https://api.jikan.moe/v4/anime?q=...)
```

**La causa**: en `src/lib/http.js` el timeout **nunca** se reintentaba (el
`catch` cortaba con `break` en el `AbortError`), y además el `AbortController`
era uno solo para todos los intentos: si el primer intento moría por timeout,
el segundo nacía con la señal ya abortada.

**El arreglo**:
- `src/lib/http.js`: el `AbortController` y el timer son **por intento**, y
  existe la opción `retryOnTimeout` (por defecto `false`: un deadline vencido
  no se reintenta solo).
- `src/hybrid/animeinfo/animeinfo.js`: timeout de **20 s**, 2 reintentos y
  `retryOnTimeout: true` (Jikan es gratis y lento, pero responde si se espera).

### 4. Warnings de deprecación de discord.js

```
Warning: Supplying "ephemeral" for interaction response options is deprecated.
Warning: Supplying "fetchReply" for interaction response options is deprecated.
```

- `ephemeral` → `flags: MessageFlags.Ephemeral` en los 42 archivos que lo
  usaban (más el helper `src/lib/reply.js`, que ahora traduce solo y le saca
  el bit efímero cuando la respuesta es a un mensaje de canal, porque ahí
  Discord lo rechaza).
- `fetchReply: true` → `withResponse: true` + `.resource.message`, con un
  helper nuevo: `replyAndGetMessage(ctx, payload)`.

### 5. La música

El bot arrancaba con "música desactivada — no hay nodos de Lavalink
configurados". Se configuró el nodo en el `.env`:

```env
LAVALINK_NAME=TripleN
LAVALINK_URL=lavalink.nazha.online:443
LAVALINK_PASSWORD=nazhafreelava
LAVALINK_SECURE=true
```

Verificado contra el nodo: `/version` responde `4.2.2` y `loadtracks` resuelve
búsquedas `ytmsearch`.

Además, `src/config.js` ahora normaliza la URL (si alguien pega
`wss://nodo.com:443`, se le saca el protocolo) y deduce `secure` del protocolo
cuando `LAVALINK_SECURE` no está puesto.

### Verificación

- `node --check` sobre los 811 archivos de `src/`: OK.
- Carga de los 811 módulos: OK, sin errores.
- `npm run verify:ui` → 42 OK / 0 errores.
- `npm run verify:panels` → 81 OK / 0 errores.
- `npm run verify:commands`, `verify:slash`, `verify:docs` → OK.
