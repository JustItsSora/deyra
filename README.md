# Deyra 🤖

**Versión 2.1.0** — incluye la fusión del módulo de música (filtros de audio, biblioteca personal, 24/7, fairplay, premium y votos) y la capa de JSON estructurado + tool calls para la IA.

Bot de Discord todo-en-uno, creado para **Ryu**. Más de 540 comandos entre moderación, tickets, automod, economía, niveles, diversión, utilidad y configuración de servidor — todos disponibles tanto como **slash commands** (`/comando`) como **comandos de prefijo** (`!comando`).

## Índice
1. [Requisitos previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración (.env)](#configuración-env)
4. [Actualizar el bot (migraciones)](#actualizar-el-bot-migraciones)
5. [Subir los emojis personalizados](#subir-los-emojis-personalizados)
6. [Iniciar el bot](#iniciar-el-bot)
7. [Sistema de diseño de los paneles](#sistema-de-diseño-de-los-paneles)
8. [Comandos](#comandos)
9. [Estructura del proyecto](#estructura-del-proyecto)
10. [Módulos incluidos](#módulos-incluidos)
11. [Verificación](#verificación)
12. [Comandos de owner](#comandos-de-owner)
13. [Solución de problemas](#solución-de-problemas)

---

## Requisitos previos

- **Node.js 20 o superior** ([descargar aquí](https://nodejs.org))
- Una aplicación de Discord creada en el [Developer Portal](https://discord.com/developers/applications)
- El **Token** y **Client ID** de esa aplicación

### Intents privilegiados (importante)

Deyra necesita 3 intents privilegiados activados en el Developer Portal → tu aplicación → **Bot** → sección **Privileged Gateway Intents**:
- ✅ **Presence Intent**
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

Sin esto, el bot no podrá leer comandos de prefijo, detectar bienvenidas correctamente, ni el automod funcionará sobre el contenido de los mensajes.

---

## Instalación

```bash
# 1. Entra a la carpeta del proyecto
cd deyra

# 2. Instala las dependencias
npm install
```

---

## Configuración (.env)

1. Copia `.env.example` a un nuevo archivo llamado `.env`:

```bash
cp .env.example .env
```

2. Abre `.env` y completa:

```env
BOT_TOKEN=el_token_de_tu_bot
CLIENT_ID=el_client_id_de_tu_aplicacion
OWNER_ID=548170108590358559
```

> `OWNER_ID` ya viene con el ID de Ryu puesto por defecto. Solo cámbialo si quieres que otra persona tenga acceso a los comandos de administración del bot (`/eval`, `/shutdown`, `/blacklist`, etc.).

**Nunca subas tu archivo `.env` a GitHub ni lo compartas.** El token de tu bot es equivalente a su contraseña.

### Variable opcional: DEV_GUILD_ID

Si estás probando el bot, puedes poner el ID de tu servidor de pruebas en `DEV_GUILD_ID` dentro del `.env`. Esto hace que los slash commands se registren **al instante** en ese servidor en vez de esperar hasta 1 hora a que Discord propague el registro global.

### Variable recomendada: HTTP_CONTACT

```env
HTTP_CONTACT=https://github.com/tu-usuario/deyra
```

Identifica al bot ante las APIs externas. **No es opcional en la práctica**: varias de las que usa Deyra (nekos.best, purrbot.site) rechazan con `403` las peticiones sin un `User-Agent` con formato `NombreApp (contacto)`, y también rechazan los que se hacen pasar por un navegador. Poné tu repo, tu web o tu página de top.gg: un valor de relleno (tipo `example.com`) también es rechazado.

Sin esto, los comandos de GIF (`/hug`, `/kiss`, `/spin`…) devuelven error aunque el bot esté funcionando perfecto.

---

## Actualizar el bot (migraciones)

Sequelize crea las tablas que faltan, pero **no altera las que ya existen** (por diseño, para no tocar datos reales). Desde la v2.2.0 el bot **aplica la migración aditiva automáticamente al arrancar** (ver `src/lib/autoMigrate.js`): detecta las columnas que los modelos declaran y la base no tiene, y solo las agrega. Es idempotente y nunca borra ni modifica datos (si algo falla, el bot arranca igual y lo registra).

Para aplicarla a mano o ver qué haría sin tocar nada:

```bash
npm run db:migrate              # aplica (idempotente)
npm run db:migrate -- --dry-run # solo muestra
```

> **v2.2.0:** agrega las columnas `automod_configs.linkAllowlist`, `escalationAction` y `escalationThreshold`. Las tablas `honeypot_configs` y `antinuke_configs` se crean solas al arrancar.

---

## Dashboard web (v2.3.0)

Deyra incluye un panel web completo en `dashboard/` (Next.js) para ver y editar la configuración del servidor sin tocar comandos, con login vía OAuth de Discord y acceso solo para administradores del servidor. Secciones: Resumen, General (prefijo, idioma, canales de sugerencias/confesiones/cumpleaños y modo NSFW), Automod, Honeypot, Anti-nuke, Tickets, Niveles (XP, cooldowns y recompensas por rol), Autorole (humanos y bots), Música (volumen, fairplay, 24/7), Bienvenidas y Registros.

El panel ofrece **varios temas oscuros** (Jade, Ámbar, Medianoche y Ciruela) conmutables desde la barra lateral —tu preferencia se guarda— y animaciones cuidadas en toda la interfaz.

Novedades del honeypot en v2.3.0: **auto-creación del canal señuelo** al activarlo sin canal asignado, **rotación automática del nombre** del canal cada N horas (los bots de raid no lo encuentran dos veces igual), **auto-purge** de los mensajes de quien caiga y contador público de capturas en `/honeypot stats`.

### Cómo funciona

Vercel es serverless, así que el panel **no** toca el SQLite directamente: el bot expone una API HTTP mínima (`src/admin/server.js`) y el dashboard habla con ella. El bot es el que manda en los datos.

```
Navegador → Dashboard (Vercel) → API admin del bot (SERVER_PORT) → SQLite
```

### Variables de entorno del bot

| Variable | Para qué |
|---|---|
| `ADMIN_API_KEY` | Secreto compartido panel↔bot (`openssl rand -hex 32`). **Sin esto la API no arranca.** |
| `ADMIN_PORT` | Puerto de la API admin. En bot-hosting.net se usa `SERVER_PORT` automáticamente. |
| `DASHBOARD_ORIGIN` | Origen exacto del dashboard para CORS, p.ej. `https://deyra-dashboard.vercel.app`. |

En bot-hosting.net el bot corre en el puerto de la variable `SERVER_PORT`; activá un subdominio HTTPS gratuito (`algo.apps.bot-hosting.cloud`) en los ajustes del deployment y poné esa URL en `BOT_API_URL` del dashboard.

### Variables de entorno del dashboard (Vercel)

| Variable | Para qué |
|---|---|
| `DISCORD_CLIENT_ID` | Client ID de la aplicación (Developer Portal). |
| `DISCORD_CLIENT_SECRET` | Secret OAuth (Developer Portal → OAuth2). |
| `DISCORD_REDIRECT_URI` | `https://TU-DOMINIO.vercel.app/api/auth/callback`. |
| `SESSION_SECRET` | Firma/encriptado de la sesión (`openssl rand -hex 32`). |
| `BOT_API_URL` | URL pública de la API admin del bot. |
| `BOT_API_KEY` | El mismo valor que `ADMIN_API_KEY` del bot. |

En el Developer Portal → OAuth2 → Redirects agregá el `DISCORD_REDIRECT_URI` exacto.

### Desarrollo local

```bash
# Terminal 1 — bot
npm run dev
# Terminal 2 — dashboard
cd dashboard
cp .env.local.example .env.local   # completá los valores
npm install
npm run dev    # http://localhost:3000
```

El panel solo lista los servidores donde **tú** tienes permiso de administrador/gestión **y** donde el bot está presente. Editar requiere lo mismo; el bot aplica los cambios con las mismas validaciones que los comandos slash.

---

## Subir los emojis personalizados

Deyra usa **Application Emojis**: emojis que pertenecen al bot mismo y funcionan en cualquier servidor donde esté presente, sin gastar slots de emoji de ese servidor.

Los dos packs que enviaste (`blueicons` y `ticks`) ya están integrados en `assets/emojis/` y catalogados en `scripts/emojiCatalog.js`. Para subirlos al Developer Portal de tu aplicación:

```bash
npm run emojis:upload
```

Esto:
1. Sube los 29 emojis (23 iconos azules + 6 ticks) a tu aplicación de Discord
2. Detecta el ID y nombre reales que Discord les asigna
3. Guarda esa información en `src/data/emojiCache.json`

**Corre este comando una sola vez, antes del primer arranque del bot.** Si más adelante quieres añadir más emojis, agrégalos a `assets/emojis/<pack>/` y una entrada nueva en `scripts/emojiCatalog.js`, luego vuelve a correr `npm run emojis:upload` — el script detecta automáticamente cuáles ya subiste y no los duplica.

Si te saltas este paso, el bot funciona igual pero usa emojis de reemplazo en unicode (✅, ❌, 🛡️, etc.) en vez de tus iconos personalizados.

---

## Iniciar el bot

```bash
npm start
```

Deberías ver algo como:

```
[boot] 548 slash commands cargados.
[boot] 946 entradas de comandos de prefijo cargadas (incluye aliases).
[boot] Base de datos lista.
[ready] Conectado como Deyra#1234 (1 servidores).
[commands] 90 comandos registrados en el servidor de desarrollo (instantáneo).
[commands] 443 comandos no se registraron como "/" por el límite de Discord
           (MAX_SLASH_COMMANDS=90). Siguen funcionando con el prefijo "!".
[jobs] Background jobs iniciados (recordatorios cada 30s, giveaways cada 15s, cumpleaños diario a las 09:00).
```

Ese aviso de "458 comandos quedan solo con prefijo" es normal y no es un error. Discord limita a 100 los slash commands por aplicación y Deyra tiene 548, así que se registran los 90 de mayor prioridad (los que la gente busca por nombre) y el resto sigue funcionando 100% con el prefijo. Cuáles entran está en `config.SLASH_CATEGORY_PRIORITY`, y se reparten por turnos entre categorías con un tope por categoría, para que el menú `/` tenga de todo y no solo utilidad.

Para desarrollo con auto-reinicio al guardar cambios:

```bash
npm run dev
```

### Invitar el bot a un servidor

Usa el comando `/invite` una vez el bot esté corriendo, o construye el link manualmente:

```
https://discord.com/api/oauth2/authorize?client_id=TU_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

(`permissions=8` = Administrador, recomendado para que todos los módulos funcionen sin fricción de permisos)

---

## Sistema de diseño de los paneles

Todos los mensajes del bot usan **Components V2** (Containers), y se arman con un sistema de diseño propio en `src/lib/ui/`. No hay embeds sueltos: cada panel pasa por el mismo constructor, así que todos se ven iguales y ninguno rompe los límites de la API.

### Cómo se escribe un panel

```js
const ui = require('../../lib/ui');

return reply(ctx, ui.payload({
    category: 'niveles',          // define el color de acento
    kicker: 'Progresión',         // línea de contexto arriba del título
    title: `Nivel ${level}`,      // título
    icon: '📈',

    stats: [                      // cifras grandes, en tarjetas
        { label: 'XP total', value: '12.4K', icon: '⭐' },
        { label: 'Mensajes', value: '1.2K', icon: '💬' },
    ],
    grid: [                       // datos en columnas alineadas
        ['ID', user.id],
        ['Se unió', '<t:1700000000:F>'],
    ],
    meters: [                     // barras de progreso
        { label: 'XP al nivel 5', value: 340, max: 500 },
    ],
    lists: [{ title: 'Roles', items: ['@Admin', '@Staff'] }],
    callouts: [{ tone: 'warning', text: 'Esto borra 15 mensajes.' }],
    media: 'https://…/imagen.jpg', // imagen o galería
    footerText: 'Fuente: MyAnimeList',
}));
```

### Bloques disponibles

| Bloque | Qué hace |
|---|---|
| `title` / `icon` / `kicker` | Jerarquía del encabezado |
| `description`, `subtitle` | Párrafos |
| `grid` | Tabla de dos columnas **alineadas** (dentro de un bloque de código) |
| `stats` | 2-3 cifras grandes en tarjetas con marco |
| `meters` | Barras de progreso, 4 estilos (`blocks`, `rounded`, `line`, `dots`) |
| `lists` | Viñetas o listas numeradas con encabezado |
| `callouts` | Avisos con 5 tonos (cada uno con símbolo, no solo color) |
| `quote` | Cita con autor |
| `media` | Imagen o galería de hasta 10, con pie y spoiler opcional |
| `sections` | Texto con un botón o miniatura al costado |
| `footerText` | Créditos; la firma de Deyra se agrega sola |

### Estados

`ui.error()`, `ui.empty()`, `ui.success()`, `ui.missingArgument()`, `ui.cooldown()`, `ui.noPermission()`, `ui.loading()`. Todos son efímeros por defecto (solo los ve quien invocó el comando) y siempre dicen qué hacer a continuación.

### Cambiar el tema

`src/lib/ui/theme.js` es la fuente única de color. Cambiar la identidad visual del bot es editar ese archivo:

```js
CATEGORIES: {
    'moderación': 0x4C6EF5,   // un color por categoría
    'diversión':  0x7048E8,
    'utilidad':   0x1E3A5F,
    // …
}
```

Para verlo sin tocar Discord:

```bash
npm run preview          # todos los bloques con datos de ejemplo
npm run preview:theme    # los colores
npm run preview:palette  # grillas, tarjetas y barras
```

También podés verlos en Discord con `/showdesign` (solo owner).

### Por qué las tablas van en bloques de código

Discord dibuja el texto normal en una fuente **proporcional**: alinear con espacios no funciona (la barra o la línea de puntos se ve torcida). Dentro de un bloque de código sí es monoespaciado, así que ahí las columnas quedan derechas. `src/lib/ui/text.js` mide el ancho real de cada cadena —incluyendo emojis y caracteres CJK, que ocupan dos columnas— para que el resultado sea correcto en cualquier idioma.

---

## Comandos

### Acciones sociales (67)

Un solo catálogo (`src/lib/socialActions.js`) define todas, y los archivos de comando se **generan** a partir de él:

```bash
npm run gif:generate          # crea/actualiza los archivos que falten
```

Para agregar una acción nueva: una línea en `socialActions.js` y el comando de arriba. No hay código repetido.

- **Con objetivo:** hug, kiss, cuddle, pat, handhold, lappillow, kabedon, carry, headpat, blowkiss, slap, poke, tickle, bite, punch, highfive, wave, wink, lick, bonk, kill, yeet, feed, nom, shoot, kick, shake, peck, handshake, salute, fluff, lay, tail
- **Sin objetivo:** smile, blush, cry, dance, happy, laugh, pout, smug, stare, think, thumbsup, run, sleep, baka, angry, bored, clap, confused, facepalm, nod, nope, shrug, sip, spin, tableflip, teehee, yawn, wag, bleh, lurk, shock, nya, comfy, chonky
- Las íntimas (hug, kiss, cuddle, pat, handhold, lappillow, kabedon, carry) traen botones de **Aceptar / Rechazar**.

### Imágenes de personaje (8)

/waifu, /neko, /kitsune, /husbando, /shiro, /senko, /okami, /holo — con autor y link a la obra original.

Se generan igual:

```bash
npm run characters:generate
```

### Buscar

`/gif <texto>` busca por palabras y entiende español: `/gif abrazos`, `/gif cosquillas`, `/gif hola`. Si no reconoce la palabra, sugiere categorías con botones.

### Contenido

| Comando | Qué hace |
|---|---|
| `/animeinfo` | Ficha de un anime (MyAnimeList) |
| `/book` | Ficha de un libro (Open Library) |
| `/tvshow` | Ficha de una serie con reparto (TVmaze, con respaldo en iTunes) |
| `/meal` | Receta completa con imagen e ingredientes (TheMealDB) |
| `/brewery` | Cervecería al azar (Open Brewery DB) |
| `/freegames` | Sorteos de juegos gratis (GamePower) |
| `/xkcd` | Tira de xkcd por número |
| `/memetemplate` | Plantillas de memes de imgflip, con botones |
| `/catmeme` | Gato con texto (cataas) |
| `/avatar` | Genera un avatar desde un texto (16 estilos de DiceBear) |
| `/urban` | Definición de Urban Dictionary |
| `/chuckjoke` | Chiste de Chuck Norris |
| `/song` | Ficha de una canción (Deezer) |
| `/steamgame` | Ficha de un juego por App ID (SteamSpy) |
| `/iss` | Posición actual de la Estación Espacial |
| `/ghsearch` | Busca repos de GitHub |
| `/nsfw` | Política de contenido del servidor (solo admins) |

### Política de contenido

Todo el contenido de Deyra es **SFW por defecto**, en todos los servidores. El interruptor `/nsfw` existe para que quien administra el servidor decida, y requiere **Gestionar servidor**.

Hoy las 65 categorías de GIF que usa el bot son SFW (nekos.best y purrbot.site solo sirven SFW en los paths que se usan), así que el interruptor no habilita nada visible. Está implementado igual, y aplicado de forma centralizada en `src/lib/contentPolicy.js`, para que cuando se conecte una fuente adulta sea una decisión consciente y no un descuido de código.

### `/clear` — borrado de mensajes en masa

```
/clear 100                       # borra los últimos 100
/clear 100 simular:true          # muestra qué BORRARÍA, sin borrar nada
/clear 2000 confirmar:true       # borra 2000 (pide confirmación explícita)
```

Filtros: `todos`, `usuario`, `bots`, `humanos`, `comandos`, `texto`, `enlaces`, `adjuntos`.

**Lo que Discord deja y no deja hacer** (ningún bot puede esquivarlo):

| Límite | Qué hace el comando |
|---|---|
| Máximo 100 por llamada | Va en lotes de 100 hasta llegar al total |
| Nada de más de 14 días | Los saltea y te dice cuántos |
| **Un bot no puede borrar mensajes de otros bots** | Los cuenta y te los señala, pero no los borra |
| Rate limit en borrados | 2s entre lotes, que es lo seguro |

Por eso el filtro `bots` **sí funciona** (limpia los mensajes del propio Deyra), pero nunca toca lo que escribieron otros bots. Cuando lo único que coincide está bloqueado, el panel lo dice explícitamente en vez de mentir con un "no hay nada que borrar".

### IA (`/ai`, `/resumir`, `/automod aifilter`)

```
/ai ¿qué es un rate limit?          le pregunta a la IA
/resumir                            resume el canal actual
/resumir #general 150               resume otro canal, más mensajes
```

## Sobre la IA: por qué no es "gratis e ilimitada"

**No existe una IA gratuita, buena e ilimitada.** Medido en septiembre de 2026:

| Proveedor | ¿Key? | Límite real | Velocidad |
|---|---|---|---|
| **Groq** | sí | 1.000 requests/día, 30/min | **1-3 s** |
| Gemini | sí | 1.500 requests/día, 10/min | 1-3 s |
| Pollinations | **no** | Irregular, ~75% de caída en imágenes | 6-30 s |
| IA local | — | Necesita 2-8 GB de RAM. Deyra tiene **256 MB** | — |

**Groq es el proveedor principal** por una razón concreta: es el más rápido, y en un canal de Discord esperar 20 segundos es casi lo mismo que no tener IA.

> Ojo: Groq y Gemini solo entran si hay key en el `.env`. Sin `GROQ_API_KEY` ni
> `GEMINI_API_KEY`, la única que responde es Pollinations (el respaldo lento).

### Datos estructurados: cómo se le pide JSON a un modelo

El bot no siempre quiere una respuesta de texto. El caso de hoy es el
**veredicto del automod**, que tiene que ser un objeto con `violacion`,
`gravedad`, `motivo` y `esFalsoPositivo`. Pedirle eso a un modelo de lenguaje y
creerle la palabra es la fuente de errores más común en un bot con IA.

Con Qwen en Groq pasan cosas que con Llama no, y las cuatro están contempladas:

| Lo que hace el modelo | Qué hace Deyra |
|---|---|
| Devuelve el JSON limpio | Lo parsea directo |
| Lo envuelve en ` ```json ` | Le saca la cerca de markdown |
| Agrega una frase antes o después | Busca el objeto balanceado |
| Devuelve el JSON **y un ejemplo** con otro objeto | Prueba cada objeto por separado, en orden |
| Mete comas colgantes, comillas simples o claves sin comillas | Las limpia (son cambios que no alteran el significado) |
| Se corta a mitad porque se acabó `max_tokens` | Lo recorta en el último par clave/valor completo |

Eso vive en `src/lib/jsonExtract.js` y tiene tres decisiones que importan:

1. **Nunca inventa un objeto.** Si no encontró nada, devuelve `ok: false` con el
   motivo. Un `{}` que aparece en medio de un texto con llaves sueltas NO cuenta como
   respuesta: el llamador tiene que poder distinguir "la IA no entendió" de
   "la IA dijo que no hay nada".
2. **No completa contenido.** Un veredicto a medio camino (`violacion: true`,
   sin motivo todavía) es información útil; uno con el motivo inventado no. El
   recorte se hace siempre en el último punto donde el JSON sigue siendo válido.
3. **`reparado` se propaga.** Si hubo que arreglar algo, el veredicto lo dice, y
   el log deja ver que el modelo se está yendo de las reglas.

**Tres capas, y hacen falta las tres.** `response_format: json_object` solo
garantiza que la respuesta sea *parseable*, no que el modelo no le ponga nada
alrededor. Por eso el pedido va con refuerzo en el **system prompt**:

```
FORMATO DE RESPUESTA (obligatorio, no negociable):
- Respondé con un único objeto JSON válido.
- Ese objeto JSON tiene que ser lo PRIMERO y lo ÚNICO que aparece en tu respuesta.
- NO uses bloques de código: nada de ``` ni de ```json.
- NO escribas texto, explicaciones ni disculpas antes o después del JSON.
- NO agregues un segundo objeto de ejemplo, aunque te parezca que ayuda.
- Si un valor no lo sabés, mandalo como null en vez de inventarlo.
```

Está en el system prompt y no en el del usuario a propósito: lo que va en el
mensaje del usuario el modelo lo trata como **datos**, y ahí las instrucciones
se cumplen peor.

| Capa | Dónde | Qué aporta |
|---|---|---|
| Modo JSON | `response_format` en Groq, `responseMimeType` en Gemini | El servidor devuelve algo parseable |
| Instrucción | `JSON_SYSTEM_SUFFIX` en `src/lib/ai.js` | El modelo no le pone markdown ni texto |
| Parser | `src/lib/jsonExtract.js` | Sobrevive a lo que se cuela igual |

Si un modelo de Groq rechaza `response_format` con 400, se reintenta sin él una
vez y se anota para el resto de la sesión, así que no se insiste.

El API nuevo para pedir datos estructurados es `ai.askJson(prompt, { schema })`:

```js
const r = await ai.askJson('Analizá el mensaje', {
    schema: { type: 'object', properties: { /* ... */ } },
    validator: (v) => typeof v.cancion === 'string',  // opcional
    maxTokens: 400,
    temperature: 0.1,
});
if (!r.ok) return; // r.reason dice por qué
```

Si el primer intento no devuelve un JSON válido, reintenta **una vez** (sin
cachear el fallo: un error cacheado envenena 6 horas).

### Tool calls, en formato MCP

`ai.askTools(prompt, { tools })` es lo mismo pero para **acciones**: el modelo no
contesta con texto, pide una herramienta y sus argumentos. Las tools se declaran
en el mismo formato que usa MCP:

```js
const r = await ai.askTools('buscá a Ryu en el servidor', {
    tools: [{
        type: 'function',
        function: {
            name: 'buscar_usuario',
            description: 'Busca un usuario del servidor',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string' }, limit: { type: 'number' } },
                required: ['query'],
            },
        },
    }],
});
// r.calls -> [{ id, name, arguments: { query: 'Ryu', limit: 5 } }]
```

Detalles que importan cuando se conecta un cliente MCP:

- Los argumentos llegan como **string** y los modelos les meten comas colgantes
  igual que en cualquier otra respuesta, así que se parsean con el extractor
  tolerante: un `{"a":1,}` no puede perder la llamada entera.
- La cadena de respaldo se acota a los proveedores que saben llamar tools
  (`context.only`). Si cae a Pollinations, que no tiene tools, devolvería texto
  plano y el llamador creería que el modelo decidió no llamar nada. Si no hay
  ninguno con capacidad, el error lo dice explícitamente.
- Groq y Gemini soportan tools; Pollinations no.

Lo que falta para hablar con un servidor MCP de verdad es el cliente (la lista
de tools y la llamada por red), que es la capa de arriba: `askTools` ya devuelve
las llamadas parseadas y listas para ejecutar.

### Pollinations va último, y avisado

Tenés razón en que no es buena: el modelo es `openai-fast` (chico) y tarda 6-30 segundos. Queda como **último recurso**, pero el bot la **marca en el panel** cuando le toca:

> ⚠️ **Respondió el modelo de respaldo**, que es bastante menor. Se usa solo porque los modelos buenos están sin cuota.

Preferimos eso a una respuesta floja que se ve igual de confiable que una buena. Si preferís un error honesto:

```env
AI_POLLINATIONS=false
```

### Modelos: por qué hay una lista y no uno fijo

Groq cambia su línea gratis sin avisar. En septiembre de 2026 `llama-3.3-70b-versatile` pasó a **de pago** ($0.59 por 1M tokens) y los gratuitos son la familia Qwen y GPT-OSS.

Por eso el bot prueba una lista y **rota solo**: si un modelo da `404 model_not_found`, pasa al siguiente. Para ver qué acepta tu key:

```bash
npm run test:ai -- --modelos
```

Te imprime los modelos disponibles, con `★` en los que el bot ya prueba, y te sugiere la línea para `GROQ_MODEL`.

### Lo que hace que el límite no se vea

| Mecanismo | Qué resuelve |
|---|---|
| **Suma de cuotas** | Groq + Gemini: ~2.500 consultas/día en vez de 1.000 |
| **Respaldo en cadena** | Si Groq da 429, salta a Gemini sin avisar |
| **Rotación de modelos** | Si un modelo sale del free tier, prueba el siguiente |
| **Cache tolerante** | `¿Cuánto es 2+2?` y `cuanto es 2 + 2` son la misma consulta. En un server real eso es ~60% del tráfico |
| **Cola en vez de error** | Si todo está saturado: "esperá, estás #2", y responde solo |
| **Respaldo rotulado** | Si le toca a Pollinations, el panel lo dice |
| **Cuota a la vista** | `/botinfo` muestra lo que queda de cada proveedor |

**Configuración** (en el `.env`):

```env
GROQ_API_KEY=...     # https://console.groq.com/keys
GEMINI_API_KEY=...   # opcional: https://aistudio.google.com/apikey
AI_ORDER=groq,gemini,pollinations
```

Sin ninguna key el bot responde igual con Pollinations: funciona, pero lento y flojo, y te lo avisa.

### Moderación asistida por IA

```bash
/automod aifilter          # muestra el estado y cómo funciona
/automod aifilter true     # activa (viene apagado)
```

La IA **no reemplaza** al automod por palabras, va después:

1. El filtro clásico corre primero. Si no hay duda, no se llama a la IA → solo se consulta en el 1-5% de los mensajes.
2. La IA revisa solo lo que puede ser falso positivo: **palabras prohibidas** y **mayúsculas**. Las reglas objetivas (invites, enlaces, menciones) nunca se tocan, porque ahí un regex acierta siempre.
3. Si dice que es falso positivo, el mensaje sobrevive y queda registrado.
4. **No borra por su cuenta** salvo con gravedad 8+. Antes de eso, avisa al canal de logs para que un humano decida.

**El límite duro: 8 segundos.** Medido, Pollinations tarda 6-30s; Groq y Gemini, 1-3s. Mientras se espera, el mensaje está visible, así que pasado ese plazo se aplica la decisión clásica. Con keys cargadas la IA responde en 2s y da tiempo real; sin ellas, la segunda opinión llega tarde. `/automod aifilter` te avisa de esto antes de activar.

Más de 500 de una vez exige `confirmar:true`: borrar 2000 mensajes por un typo no tiene arreglo.

---

## Estructura del proyecto

```
deyra/
├── src/
│   ├── client.js                # Punto de entrada
│   ├── config.js                # Configuración no-secreta (colores, prefijo, prioridad de slash...)
│   ├── hybrid/                  # Comandos disponibles como slash Y prefijo
│   │   └── <comando>/
│   │       ├── <comando>.js
│   │       └── subcommands/     # Si el comando tiene subcomandos
│   ├── commands/
│   │   ├── slash/               # Comandos solo-slash
│   │   └── prefix/              # Comandos solo-prefijo
│   ├── admin/
│   │   └── server.js            # API HTTP para el dashboard (Bearer, CORS, rate limit)
│   ├── gateway/                 # Eventos de Discord
│   │   ├── automod/             # Escaneo de mensajes y ediciones
│   │   ├── honeypot/            # Canal señuelo (trampa anti-bots/raiders)
│   │   ├── antinuke/            # Anti-nuke sobre el audit log
│   │   ├── logging/             # Registros de mensajes y miembros
│   │   └── interactions/        # Handlers de botones/menús/modals
│   ├── data/
│   │   ├── models/              # Modelos de Sequelize (31 tablas)
│   │   └── sequelize.js
│   ├── lib/
│   │   ├── ui/                  # Sistema de diseño de paneles
│   │   │   ├── theme.js         #   Colores, iconos, marca
│   │   │   ├── text.js          #   Grillas, tarjetas, barras, formato
│   │   │   ├── panel.js         #   Constructor de paneles
│   │   │   ├── states.js        #   Error, vacío, cooldown, permisos
│   │   │   ├── imagePanel.js    #   Paneles con imagen
│   │   │   └── sanitize.js      #   Saneado de texto y URLs externas
│   │   ├── api/                 # Clientes de APIs externas
│   │   │   ├── memeApi.js       #   imgflip, xkcd, cataas
│   │   │   ├── lookupApi.js     #   libros, series, juegos, ISS, GitHub...
│   │   │   └── avatarApi.js     #   DiceBear
│   │   ├── http.js              # Cliente HTTP (User-Agent, timeout, reintentos, cache)
│   │   ├── providers.js         # Respaldo entre APIs + circuit breaker
│   │   ├── gifApi.js            # Catálogo de GIFs e imágenes de anime
│   │   ├── socialActions.js     # Catálogo de acciones sociales
│   │   ├── contentPolicy.js     # Política SFW/NSFW por servidor
│   │   ├── panel.js             # Puente de compatibilidad (api vieja)
│   │   └── ...                  # reply, pagination, cooldowns, permisos
│   └── music/                   # Módulo de música (Lavalink)
├── dashboard/                   # Web de configuración (Next.js + Discord OAuth, para Vercel)
├── scripts/
│   ├── deployCommands.js        # Registra los slash commands sin arrancar el bot
│   ├── verifyUi.js              # Valida los paneles contra límites de Discord
│   ├── verifyPanels.js          # Prueba los comandos migrados con datos de ejemplo
│   ├── verifyProviders.js       # Prueba las APIs externas de verdad
│   ├── verifyCommands.js        # Consistencia de los 548 comandos
│   ├── verifySlashSelection.js  # Que el registro de slash sea estable
│   ├── dbAddColumns.js          # Migraciones de columnas
│   ├── generateGifCommands.js   # Genera los comandos sociales
│   ├── generateCharacterCommands.js
│   ├── renderPreview.js         # Vista previa del diseño en la terminal
│   ├── emojiCatalog.js
│   └── uploadEmojis.js
├── assets/emojis/               # Tus packs de iconos
└── data/deyra.sqlite            # Base de datos (se crea automáticamente)
```

---

## Módulos incluidos

| Módulo | Comandos destacados |
|---|---|
| **Moderación** | ban, kick, mute, warn, purge, lockdown, massban, addrole, auditlog |
| **Tickets** | setup, panel, claim, close, stats |
| **Automod** | invites (incl. discord.com/invite), links con allowlist, spam (frecuencia + duplicados), menciones (usuarios + roles + @everyone), mayúsculas, palabras prohibidas con límites de palabra, escalada automática por infracciones |
| **Seguridad** | honeypot (canal señuelo), anti-nuke sobre audit log, registros de miembros/mensajes/ediciones/borrados |
| **Economía** | daily, work, crime, rob, blackjack, roulette, lottery, crash, tienda |
| **Niveles** | sistema de XP con recompensas de rol automáticas |
| **Social/Diversión** | 67 acciones con GIF (hug, kiss, slap, bonk, spin, cry…) + juegos, trivia, quizzes, 8 imágenes de personaje, buscador de GIFs |
| **Utilidad** | conversores, cifrados, validadores, serverinfo, userinfo, botinfo, iss, ghsearch |
| **Configuración** | welcome, autorole, reaction roles, giveaways, birthdays, confesiones, política de contenido |
| **Música** | 38 comandos con Lavalink: play, queue, skip, lyrics, autoplay, filtros de audio, 24/7, fairplay, playlists, favoritas e historial |

Usa `/help` dentro de Discord para ver todos los comandos organizados por categoría con un menú desplegable.

### APIs externas

El bot depende de APIs gratuitas de terceros, así que está armado para que una caída no se.note:

- **Respaldo en cadena:** cada comando declara una lista de proveedores y los prueba en orden (`src/lib/providers.js`).
- **Circuit breaker:** el proveedor que falla 3 veces queda en cuarentena 5 minutos, para no(sumar 12 segundos de espera a cada comando.
- **Cache con stale-if-error:** si el proveedor está caído pero hay una copia en caché, se sirve esa antes que un error.
- **`/botinfo`** muestra el estado de salud de todos los proveedores.

Y la más importante: **identificarse correctamente**. Con el User-Agent mal puesto (o sin poner), nekos.best devuelve `403` y todos los GIFs dejan de funcionar. Ver [HTTP_CONTACT](#variable-recomendada-http_contact).

| Fuente | Qué aporta |
|---|---|
| nekos.best | 65 categorías de GIF de anime + 4 imágenes de personaje |
| purrbot.site | Respaldo de GIFs |
| imgflip, xkcd, cataas | Memes |
| DiceBear | Generador de avatares (16 estilos) |
| MyAnimeList (Jikan), Kitsu | Fichas de anime |
| Open Library, TVmaze, iTunes | Libros y series |
| TheMealDB, Open Brewery DB | Recetas y cervecerías |
| GamePower, SteamSpy | Sorteos y juegos de Steam |
| Open Notify, OpenCage | ISS y geography |
| Deezer, Urban Dictionary, GitHub, Chuck Norris API | Música, definiciones, repos, chistes |

---

## Módulo de música: qué se sumó en la etapa 9

El motor de música es el mismo de antes (Kazagumo sobre Shoukaku/Lavalink). Lo
que cambió fue todo lo que se armó **alrededor** del reproductor, tomando como
base el diseño de otro bot de música y portándolo a las convenciones de este
proyecto.

### Filtros de audio — `/filter`

Once presets (`bassboost`, `nightcore`, `vaporwave`, `pop`, `rock`,
`electronic`, `lofi`, `trap`, `8d`, `soft`, `treble`) con ecualización de 14
bandas, más velocidad y rotación en los que corresponde.

```bash
/filter usar nightcore     # o: !filter usar nightcore
/filter quitar
/filter listar             # el catálogo con botones
```

Tres detalles que no son visibles hasta que los pisás:

- **El menú no expira.** Los botones van al dispatcher global
  (`src/gateway/interactions/musicHandler.js`), no a un collector por comando.
  Antes cada panel montaba el suyo con 5 minutos de vida, así que se quedaba sin
  botones que respondan mientras la música seguía sonando.
- **El filtro se reaplica en cada canción.** Lavalink no arrastra los filtros de
  una pista a la siguiente; sin el reaplicado de `playerStart.js`, un nightcore
  sonaba en una canción y al siguiente tema volvía al sonido normal sin avisar.
- **Hay un solo autoplay.** Lavalink trae el suyo y este bot trae el suyo (en
  `playerEnd.js`). Con los dos prendidos Lavalink reinicia la pista, el bot
  agrega otra, y quedan dos sonando. `playerStart.js` apaga explícitamente el de
  Lavalink para que haya una sola fuente de verdad.

### Biblioteca personal — `/favourite`, `/favourites`, `/playlist`, `/history`

| Comando | Qué hace |
|---|---|
| `/favourite` | Guarda la canción que está sonando. Si ya estaba guardada, la saca |
| `/favourite reproducir <canción>` | Pone en la cola una de tus favoritas |
| `/favourites` | Lista con paginación por botones |
| `/playlist crear\|agregar\|quitar\|mover\|lista\|canciones\|reproducir\|renombrar\|borrar` | Playlists personales, con autocompletado de nombres |
| `/history` | Lo que escuchaste, y con `--server` lo que escuchó el server |

El historial antes vivía en la memoria del reproductor: se vaciaba en cada
`/stop` y se perdía en cada reinicio del bot, con un máximo de 20 canciones de
la sesión actual. Ahora cada canción que suena se escribe en `music_history`, y
`/history` pagina sobre eso.

Todo esto se guardó en el **SQLite que ya tenías** (`data/deyra.sqlite`), con
modelos Sequelize como el resto del bot. El proyecto del que vino la idea usaba
PostgreSQL + Redis: trayendo eso tal cual, el bot pasaba a necesitar dos
servicios extra para poder reproducir música, en un host donde Lavalink ya
consume la RAM por separado.

### 24/7 y fairplay — `/twentyfourseven`, `/musicconfig`

```bash
/twentyfourseven on        # el bot se queda solo en el canal donde está
/musicconfig fairplay on   # solo el rol configurado controla la música
/musicconfig rol @Dj       # quién puede controlarla
/musicconfig volumen 60    # volumen inicial de los próximos reproductores
/musicconfig autoplay on
/musicconfig ver           # el estado completo
```

- **24/7**: se aplica al canal donde el reproductor ya está conectado, y queda
  guardado en la base. Un job cada 15 minutos lo revive si el bot se reinició o
  se cayó el nodo de música, y se desactiva solo si el canal configurado ya no
  existe (un ajuste que no se puede cumplir es peor que un ajuste apagado).
- **Fairplay**: el bot sigue sonando para todo el mundo, pero solo los miembros
  con el rol configurado (y quien tenga permiso de silenciar miembros) pueden
  cambiar qué suena.

Lo que **no** se portó del diseño original: el reordenamiento round-robin de la
cola por petición, que en ese bot era gratis porque todas las altas pasaban por
un solo objeto. Con Kazagumo la cola es un `Array` y no hay un punto único por
el que pasen, así que reordenarla de forma confiable implicaría tocar cada
comando de reproducción. Se eligió el control de acceso, que es lo que la gente
realmente pide, y la cola quedó en orden de llegada.

### Premium y votos de top.gg — `/premium`, `/vote`

Deyra no cobra: el acceso se abre con un voto en top.gg o con premium.

| | Gratis | Con voto o premium |
|---|---|---|
| Playlists | 5 | 15 |
| Canciones por playlist | 25 | 50 |
| Favoritas | 15 | 50 |
| Historial | 50 | 200 |

Los límites **nunca borran lo que ya tenés**: solo frenan agregar más. Y el
premium no abre funciones ocultas, sube números: los filtros, la cola y el 24/7
son de todos.

Para que el voto cuente, hay que apuntar un webhook de top.gg al servidor que
levanta el bot (`src/music/lib/voteWebhook.js`, sin dependencias nuevas: es
`node:http`). Configuración en el `.env`:

```env
TOPGG_VOTES_ENABLED=true
TOPGG_WEBHOOK_SECRET=whs_el_secreto_del_panel
VOTES_WEBHOOK_PORT=6969
```

El receptor valida la firma `t=<unix>,v1=<hex>` con HMAC-SHA256 y comparación
por tiempo constante, y descarta los reintentos de top.gg para no contar el
mismo voto dos veces. Con la variable apagada (el default) no se abre ningún
puerto.

### El panel de reproducción

`playerStart.js` ya no arma su propio `ContainerBuilder` ni su collector: usa
`src/music/ui/playerPanel.js`, el mismo panel que muestran `/nowplaying` y el
handler de botones. Eso arregla de paso dos cosas que estaban rotas: `/nowplaying`
mostraba un panel distinto sin botones, y con una barra de progreso que nunca se
llenaba (el ternario de las dos ramas daba el mismo resultado).

La barra del panel se refresca sola desde el evento `playerUpdate`, con un tope
de una edición cada 5 segundos: Lavalink manda ese evento varias veces por
segundo y editar el mensaje a esa frecuencia hace que Discord devuelva `429` al
canal entero.

### Base de datos

Ocho tablas nuevas en el mismo SQLite (`scripts/dbAddColumns.js` las agrega si
hacen falta, y `sequelize.sync()` las crea):

`music_configs` · `music_playlists` · `music_playlist_tracks` · `music_favorites` ·
`music_history` · `user_premiums` · `guild_premiums` · `music_votes`

### Créditos

El diseño de filtros, el panel de reproducción, la estructura de la biblioteca y
el receptor de votos vienen de **Eleven Music**, del proyecto **OpenUwU**
(`@priyanshu`, `@prayag`, `@bre4d777`, `@mooncarli`), declarado bajo `OUSL-1.0`.

Ese proyecto no incluye el texto de su licencia, así que **Deyra se trata como
derivado**: publica el código fuente completo, conserva la atribución y no se
ofrece como servicio pago. Los links a su repositorio, su documentación, sus
emojis y sus identificadores de top.gg **no** están en ningún comando: están en
`/credits` y en [`NOTICE.md`](NOTICE.md), que es donde la atribución tiene que
estar.


---

## Música: el nodo configurado

Deyra tiene 38 comandos de música, pero **no funcionan hasta que configures un nodo de Lavalink**. No es un oversight: es que no queda ningún nodo público gratis.

### Nodo en uso

El bot está configurado contra este nodo (verificado: el endpoint `version` de Lavalink responde `4.2.2` y `loadtracks` resuelve búsquedas `ytmsearch`):

```env
LAVALINK_NAME=TripleN
LAVALINK_URL=lavalink.nazha.online:443
LAVALINK_PASSWORD=nazhafreelava
LAVALINK_SECURE=true
```

Ojo con dos detalles:

- La URL va **sin protocolo**: el bot arma `wss://` cuando `LAVALINK_SECURE=true` y `ws://` cuando es `false`.
- El puerto `443` con `SECURE=true` es TLS: es un nodo detrás de un proxy inverso (Caddy/Nginx), no Lavalink desnudo.

Si el nodo se cae, el bot lo dice claro en cada comando de música (panel "La música no está conectada") en vez de tirar `No node found`.

### Por qué antes venía apagada

Medido el 27/09/2026: se probaron **54 nodos** entre la lista oficial de [lavalink-list.darrennathanael.com](https://lavalink-list.darrennathanael.com) y tres listas comunitarias (`MinazukiAmane/lavalink-list-2`, `project-gate/list`, `stackryze/lavalink-list`). **Ninguno respondió.** Se descartó DNS y conectividad como causa: `api.github.com` y `discord.com` resolvían bien desde el mismo entorno.

El nodo que estaba hardcodeado (`lavalink.jirayu.net:13592`) devuelve `404` en el endpoint de estado: el host responde, pero ya no corre Lavalink ahí.

### Levantar tu propio nodo

Lavalink es **Java y come ~300 MB de RAM**, así que no puede correr junto al bot en un host de 256 MB. Va aparte:

```bash
# En tu PC, o en una VPS, o en un contenedor propio
docker run -p 2333:2333 -e _JAVA_OPTIONS=-Xmx1G \
  ghcr.io/lavalink-devs/lavalink:latest
```

Después, en el `.env` del bot:

```env
LAVALINK_URL=127.0.0.1:2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
```

Para que responda desde internet (si no está en la misma máquina), túnel con `playit.gg` o `cloudflared`.

### Redundancia

Los nodos públicos se caen seguido, así que podés configurar varios. Shoukaku elige el de menor penalización y saltea al otro cuando uno muere:

```env
LAVALINK_URL=mi-nodo.com:2333
LAVALINK_PASSWORD=secreto
LAVALINK_EXTRA_NODES=respaldo1.com:443:clave1,respaldo2.com:80:clave2
```

### Sin nodo, el bot lo dice claro

Los 38 comandos pasan por `requireMusic`, que verifica que haya un nodo **conectado** y no solo que el manager exista. Si no hay, responden con un panel que explica que el problema es el servidor de música, no un permiso:

> 🔌 **La música no está conectada**
> El bot entra bien al canal de voz, pero no puede buscar ni reproducir porque no se conectó a ningún servidor de música.
> **Para revisarlo (lo hace quien administra el bot)**
> · Hay 1 nodo configurado, pero no respondió al conectarse.
> · Casi siempre es que el nodo está caído, no que falte un permiso en el server.
> · Se arregla en el `.env` con `LAVALINK_URL` y `LAVALINK_PASSWORD` correctos, y reiniciando el bot.

---

## Errores claros

Un comando inexistente o que falla ahora responde algo accionable en vez de un mensaje genérico:

| Situación | Antes | Ahora |
|---|---|---|
| `!djjoin` (no existe) | silencio total | "No encontré el comando. Seguro quisiste decir `!join`, `!dectobin`" |
| `/play` sin Lavalink | `No pude conectarme al canal de voz: No node found` | panel que dice que el problema es el servidor de música |
| `/clear` sobre un mensaje de 15 días | `Ocurrió un error ejecutando este comando` | "Ese mensaje ya no existe. Alguien lo borró o tiene más de 14 días." |
| Bug interno del bot | `Ocurrió un error ejecutando este comando` | "Algo falló dentro del bot y no es un problema de tu server" + el stack queda solo en la consola |

La lógica está en `src/lib/errorReport.js` (traduce errores) y `src/lib/commandSuggest.js` (sugiere comandos parecidos por distancia de Levenshtein + prefijo común).

Los errores de Discord con código se traducen; los bugs internos **no** se filtran al canal, porque publicar un stack en un server público publica la estructura del bot.

---

## Verificación

```bash
npm run verify           # Sin internet: paneles, comandos, registro de slash
npm run verify:providers # Con internet: prueba las APIs de verdad
npm run verify:all       # Todo
```

| Script | Qué comprueba |
|---|---|
| `verify:ui` | 42 casos del sistema de diseño contra los límites reales de Discord |
| `verify:panels` | 41 casos con los comandos migrados y contenido hostil (texto de 20k, markdown roto, URLs de `javascript:`, 25 imágenes) |
| `verify:commands` | Los 834 archivos cargan, los 548 comandos son válidos, no hay colisiones de nombres ni alias, las categorías de GIF existen |
| `verify:slash` | Que la selección de slash commands sea estable entre cargas (si no, el bot re-registra 90 comandos en cada deploy sin motivo) |
| `verify:providers` | Las APIs externas responden de verdad, y la capa HTTP (User-Agent, cache, stale-if-error, circuit breaker) funciona |

`/showdesign` (solo owner) muestra los ejemplos de cada bloque dentro de Discord.

---

## Comandos de owner

Estos comandos solo funcionan para el usuario cuyo ID coincide con `OWNER_ID` en tu `.env`:

- `/eval` — ejecuta código JavaScript (depuración)
- `/shutdown` — apaga el bot de forma segura
- `/reload` — recarga todos los comandos sin reiniciar el proceso
- `/blacklist`, `/unblacklist`, `/blacklistlist` — bloquea usuarios de usar el bot
- `/maintenance` — activa modo mantenimiento
- `/setstatus`, `/setactivity`, `/setavatar`, `/setbotname` — personaliza la presencia del bot
- `/serverlist` — lista todos los servidores donde está el bot
- `/showdesign` — muestra ejemplos de cada bloque del diseño de paneles

---

## Solución de problemas

**Los GIFs no funcionan (`/hug`, `/kiss`…) dan error** → Es el problema más común, y casi siempre es el User-Agent. Corré `/botinfo`: si dice que nekos.best está caído, revisá la variable `HTTP_CONTACT` en el `.env` y reiniciá. Un valor de relleno (tipo `example.com`) también lo rechazan.

**Un comando no aparece en el menú `/` pero sí con prefijo** → Deyra tiene 548 comandos y Discord acepta 100. Se registran los 90 de mayor prioridad y el resto funciona con `!comando`. El aviso `[commands] N comandos no se registraron` es normal. Para cambiar cuáles entran, editá `SLASH_CATEGORY_PRIORITY` y `SLASH_ALWAYS_INCLUDE` en `config.js`.

**Un panel no se envía** → Significa que pasó el límite de la API de Discord. Corré `npm run verify:panels`, que valida el JSON exacto contra los límites reales y te dice qué bloque lo rompió.

**`/help` muestra una categoría vacía o desactualizada** → `/help` lee la lista en memoria: reiniciá el bot, o usá `/reload`.

**"Falta BOT_TOKEN en el .env"** → Verifica que copiaste `.env.example` a `.env` y llenaste el token real.

**Los comandos de prefijo no responden** → Revisa que el intent **Message Content** esté activado en el Developer Portal.

**Los emojis se ven como ✅ en vez de tus iconos** → Corre `npm run emojis:upload` y reinicia el bot.

**"No se pudo inicializar la base de datos"** → Asegúrate de que la carpeta del proyecto tenga permisos de escritura; SQLite necesita crear el archivo `data/deyra.sqlite`.

**Los slash commands no aparecen en Discord** → Si no configuraste `DEV_GUILD_ID`, el registro global puede tardar hasta 1 hora en propagar. Para pruebas inmediatas, usa `DEV_GUILD_ID`.

**Un comando nuevo no aparece ni con prefijo** → Agregar un comando es crear la carpeta `src/hybrid/<nombre>/<nombre>.js` con la misma forma que los demás. Si es una acción social o una imagen de personaje, no lo escribas a mano: corré `npm run gif:generate` o `npm run characters:generate`. Después reiniciá (o `/reload`).
