// src/lib/errorReport.js
//
// Convierte una excepción en un panel que le sirve al usuario.
//
// El problema que resuelve: el handler globalcatcheaba y mostraba "Ocurrió un
// error ejecutando este comando. Inténtalo de nuevo más tarde." Eso es un
// mensaje defiction: no dice qué pasó, no dice si tiene sentido reintentar, y
// el usuario no puede hacer nada con él.
//
// La regla acá es deliberadamente asimétrica:
//
//   · Errores de la API de Discord → se muestran. Son esperados (no podés
//     borrar 2000 mensajes, no tenés permisos, el mensaje tiene más de 14 días)
//     y el texto dice exactamente qué hacer.
//
//   · Bugs del código → no se muestran. Un TypeError no significa nada para
//     quien lo disparó, y filtrarlo en un canal público publica la
//     estructura interna del bot. Va a la consola, que es donde sirve.

/** Códigos de Discord con un significado que el usuario puede actuar. */
const AMIGABLES = {
    50013: 'Discord no me deja hacer eso. Suele ser que faltan permisos en el canal, o que la acción es más grande que lo que Discord permite por llamada.',
    50001: 'Discord no me deja escribir acá. Revisá que el bot pueda ver el canal y enviar mensajes.',
    50007: 'No puedo Mentionear a ese usuario. Es un bot, o no está en este servidor.',
    160002: 'Ese canal no existe. Puede que se haya borrado.',
    10008: 'Ese mensaje ya no existe. Alguien lo borró o tiene más de 14 días.',
    10013: 'Ese canal no existe.',
    50035: 'La acción no es válida en este tipo de canal.',
    50021: 'No puedo convertir ese rol. Está por encima del mío.',
    50028: 'Los roles de audio no están habilitados en este servidor.',
    20001: 'Soy yo mismo, no me puedo hacer eso.',
    30003: 'Ese canal tiene más de 50 canales, hay que elegir en cuál crear.',
    160003: 'Este comando no se puede usar en este canal.',
    20024: 'Ese rol está gestionado por una integración, no lo puedo editar.',
    50083: 'Este hilo ya está archivado.',
    160004: 'No puedo pinear mensajes en este canal.',
    50083: 'Ese hilo está archivado.',
    50031: 'No puedo leer el historial de este canal. Habilitá el permiso de ver mensajes.',
    50011: 'No puedo editar eso.',
    40007: 'Ese usuario no está en este servidor.',
};

/** Errores de negocio de la API de Lavalink, que son nuestros y sí se explican. */
const MUSICA = {
    NO_NODE: /no node found|no nodes available/i,
    NO_PLAYER: /player not found|no player/i,
    VOICE: /voice connection|not connected|disconnected/i,
};

/**
 * Construye el panel de error.
 *
 * @param {string} title      título del panel
 * @param {Error} err         la excepción
 * @param {string} [command]  nombre del comando, para el pie
 * @returns {object} payload listo para reply()
 */
function errorReport(title, err, command) {
    const message = String(err?.message || err || 'Error desconocido');
    const code = err?.code || err?.status;

    // 1. Error de música: son nuestros y el texto dice qué hacer.
    if (MUSICA.NO_NODE.test(message)) {
        return {
            category: 'música',
            kicker: 'Sin servidor de música',
            title: 'La música no está conectada',
            icon: '🔌',
            description: 'El bot no logró conectarse a ningún servidor de música, así que no puede reproducir.',
            callouts: [{
                tone: 'muted',
                text: 'No es un problema de permisos ni del canal de voz. Quien administra el bot tiene que revisar el nodo de Lavalink.',
            }],
        };
    }

    if (MUSICA.NO_PLAYER.test(message)) {
        return {
            category: 'música',
            kicker: 'Sin reproducción',
            title: 'No hay nada reproduciendo',
            icon: '⏸️',
            description: 'No encontré un reproductor activo en este servidor. Usá `/play` para empezar una.',
        };
    }

    // 2. Error de la API de Discord: se muestra el texto real.
    if (code && AMIGABLES[code]) {
        return {
            category: 'utilidad',
            kicker: 'Discord lo bloqueó',
            title,
            icon: '🚫',
            description: AMIGABLES[code],
            callouts: [{
                tone: 'muted',
                text: `Discord devolvió el error \`${code}\`. Si creés que no debería pasar, pasáselo a quien administra el bot.`,
            }],
        };
    }

    // 3. Mensajes que ya son claros y vienen de nuestros propios comandos.
    //    Un "Necesitás el permiso X" no necesita traducción.
    if (/permiso|necesit|sin acceso|requiere/i.test(message) && message.length < 220) {
        return {
            category: 'utilidad',
            kicker: 'No se pudo completar',
            title,
            icon: '🚫',
            description: message,
        };
    }

    // 4. Bug. No se filtra nada: la consola ya lo tiene con el stack completo.
    return {
        category: 'utilidad',
        kicker: 'Algo salió mal',
        title,
        icon: '⚠️',
        description: 'Algo falló dentro del bot y no es un problema de tu server ni de tus permisos.',
        callouts: [{
            tone: 'muted',
            text: 'El error quedó registrado en la consola del bot. Si se repite, pasale este comando a quien lo administra.',
        }],
        footerText: command ? `Comando: ${command}` : undefined,
    };
}

module.exports = { errorReport, AMIGABLES };
