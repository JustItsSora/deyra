// src/lib/dumpExporter.js
// Genera archivos .txt de respaldo/auditoría (roles, canales, baneos, etc.)
// que los comandos /dump* envían por DM a quien los pide. Nunca se postea
// en el canal — solo lo recibe quien ejecutó el comando, y solo si tiene el
// permiso correspondiente (ver cada comando en src/hybrid/dump*).

const fs = require('fs');
const path = require('path');

class DumpExporter {
    static async createDumpFile(filename, content) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const sanitizedFilename = `dump-${filename}-${timestamp}.txt`;
        const tempPath = path.join(__dirname, '..', '..', 'data', 'temp', sanitizedFilename);

        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const header = this.createHeader(filename);
        fs.writeFileSync(tempPath, `${header}\n\n${content}`, 'utf-8');

        return { path: tempPath, filename: sanitizedFilename };
    }

    static createHeader(title) {
        const timestamp = new Date().toLocaleString('es-AR');
        return `${'='.repeat(60)}\n${title.toUpperCase()}\nGenerado: ${timestamp}\n${'='.repeat(60)}`;
    }

    static formatRoles(guild) {
        const roles = guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map((role) => {
                const members = role.members.size;
                const permissions = role.permissions.toArray().join(', ') || 'Ninguno';
                return `\n[Rol: ${role.name}]\n`
                    + `  ID: ${role.id}\n`
                    + `  Posición: ${role.position}\n`
                    + `  Color: ${role.hexColor}\n`
                    + `  Miembros: ${members}\n`
                    + `  Mencionable: ${role.mentionable ? 'Sí' : 'No'}\n`
                    + `  Separado (hoisted): ${role.hoist ? 'Sí' : 'No'}\n`
                    + `  Administrado por integración: ${role.managed ? 'Sí' : 'No'}\n`
                    + `  Permisos: ${permissions}`;
            })
            .join(`\n${'-'.repeat(60)}`);

        return `Total de roles: ${guild.roles.cache.size}\n${roles}`;
    }

    static formatChannels(guild) {
        const textChannels = guild.channels.cache.filter((ch) => ch.type === 0);
        const channels = textChannels
            .sort((a, b) => a.position - b.position)
            .map((channel) => `\n[Canal: #${channel.name}]\n`
                + `  ID: ${channel.id}\n`
                + `  Categoría: ${channel.parent?.name || 'Ninguna'}\n`
                + `  Posición: ${channel.position}\n`
                + `  Tema: ${channel.topic || 'Sin tema configurado'}\n`
                + `  NSFW: ${channel.nsfw ? 'Sí' : 'No'}\n`
                + `  Modo lento: ${channel.rateLimitPerUser || 0} segundos`)
            .join(`\n${'-'.repeat(60)}`);

        return `Total de canales de texto: ${textChannels.size}\n${channels}`;
    }

    static formatVoiceChannels(guild) {
        const voiceChannels = guild.channels.cache.filter((ch) => ch.type === 2);
        const channels = voiceChannels
            .sort((a, b) => a.position - b.position)
            .map((channel) => `\n[Canal de voz: ${channel.name}]\n`
                + `  ID: ${channel.id}\n`
                + `  Categoría: ${channel.parent?.name || 'Ninguna'}\n`
                + `  Posición: ${channel.position}\n`
                + `  Bitrate: ${channel.bitrate / 1000}kbps\n`
                + `  Límite de usuarios: ${channel.userLimit || 'Sin límite'}\n`
                + `  Región RTC: ${channel.rtcRegion || 'Automática'}`)
            .join(`\n${'-'.repeat(60)}`);

        return `Total de canales de voz: ${voiceChannels.size}\n${channels}`;
    }

    static formatCategories(guild) {
        const categoryChannels = guild.channels.cache.filter((ch) => ch.type === 4);
        const categories = categoryChannels
            .sort((a, b) => a.position - b.position)
            .map((category) => {
                const children = guild.channels.cache.filter((ch) => ch.parentId === category.id);
                const textCount = children.filter((ch) => ch.type === 0).size;
                const voiceCount = children.filter((ch) => ch.type === 2).size;

                return `\n[Categoría: ${category.name}]\n`
                    + `  ID: ${category.id}\n`
                    + `  Posición: ${category.position}\n`
                    + `  Canales de texto: ${textCount}\n`
                    + `  Canales de voz: ${voiceCount}\n`
                    + `  Total de canales: ${children.size}`;
            })
            .join(`\n${'-'.repeat(60)}`);

        return `Total de categorías: ${categoryChannels.size}\n${categories}`;
    }

    static formatEmojis(guild) {
        const emojis = guild.emojis.cache
            .map((emoji) => `\n[Emoji: ${emoji.name}]\n`
                + `  ID: ${emoji.id}\n`
                + `  Animado: ${emoji.animated ? 'Sí' : 'No'}\n`
                + `  Disponible: ${emoji.available ? 'Sí' : 'No'}\n`
                + `  Administrado por integración: ${emoji.managed ? 'Sí' : 'No'}\n`
                + `  URL: ${emoji.url}`)
            .join(`\n${'-'.repeat(60)}`);

        return `Total de emojis: ${guild.emojis.cache.size}\n${emojis}`;
    }

    static formatMembers(guild, filterBots = false, botsOnly = false) {
        let members = guild.members.cache;
        if (filterBots) members = members.filter((m) => !m.user.bot);
        else if (botsOnly) members = members.filter((m) => m.user.bot);

        const formatted = members
            .map((member) => {
                const roles = member.roles.cache.filter((r) => r.id !== guild.id).map((r) => r.name).join(', ') || 'Ninguno';
                return `\n[${member.user.bot ? 'Bot' : 'Usuario'}: ${member.user.tag}]\n`
                    + `  ID: ${member.user.id}\n`
                    + `  Apodo: ${member.nickname || 'Ninguno'}\n`
                    + `  Se unió al servidor: ${member.joinedAt ? member.joinedAt.toLocaleString('es-AR') : 'Desconocido'}\n`
                    + `  Cuenta creada: ${member.user.createdAt.toLocaleString('es-AR')}\n`
                    + `  Roles: ${roles}\n`
                    + `  Rol más alto: ${member.roles.highest.name}`;
            })
            .join(`\n${'-'.repeat(60)}`);

        const label = filterBots ? 'Humanos' : (botsOnly ? 'Bots' : 'Miembros');
        return `Total de ${label}: ${members.size}\n${formatted}`;
    }

    static async formatMessages(channel, limit = 100) {
        try {
            const messages = await channel.messages.fetch({ limit });
            const formatted = messages
                .reverse()
                .map((msg) => {
                    const attachments = msg.attachments.size > 0
                        ? `\n  Adjuntos: ${msg.attachments.map((a) => a.url).join(', ')}`
                        : '';
                    return `\n[${msg.author.tag}] - ${msg.createdAt.toLocaleString('es-AR')}\n`
                        + `  ID: ${msg.id}\n`
                        + `  Contenido: ${msg.content || '(sin contenido de texto)'}${attachments}`;
                })
                .join(`\n${'-'.repeat(60)}`);

            return `Canal: #${channel.name}\nTotal de mensajes obtenidos: ${messages.size}\n${formatted}`;
        } catch (err) {
            throw new Error(`No se pudieron obtener los mensajes: ${err.message}`);
        }
    }

    static async formatBans(guild) {
        try {
            const bans = await guild.bans.fetch();
            const formatted = bans
                .map((ban) => `\n[Usuario baneado: ${ban.user.tag}]\n`
                    + `  ID: ${ban.user.id}\n`
                    + `  Razón: ${ban.reason || 'Sin razón especificada'}`)
                .join(`\n${'-'.repeat(60)}`);

            return `Total de baneos: ${bans.size}\n${formatted}`;
        } catch (err) {
            throw new Error(`No se pudieron obtener los baneos: ${err.message}`);
        }
    }

    static formatSettings(guild) {
        return `Nombre del servidor: ${guild.name}\n`
            + `ID del servidor: ${guild.id}\n`
            + `Dueño: ${guild.ownerId}\n`
            + `Creado: ${guild.createdAt.toLocaleString('es-AR')}\n`
            + `Cantidad de miembros: ${guild.memberCount}\n`
            + `Nivel de boost: ${guild.premiumTier}\n`
            + `Cantidad de boosts: ${guild.premiumSubscriptionCount || 0}\n`
            + `Nivel de verificación: ${guild.verificationLevel}\n`
            + `Filtro de contenido explícito: ${guild.explicitContentFilter}\n`
            + `Notificaciones por defecto: ${guild.defaultMessageNotifications}\n`
            + `Nivel de MFA: ${guild.mfaLevel}\n`
            + `Canal AFK: ${guild.afkChannel?.name || 'Ninguno'}\n`
            + `Tiempo de espera AFK: ${guild.afkTimeout} segundos\n`
            + `Canal del sistema: ${guild.systemChannel?.name || 'Ninguno'}\n`
            + `Canal de reglas: ${guild.rulesChannel?.name || 'Ninguno'}\n`
            + `Descripción: ${guild.description || 'Ninguna'}\n`
            + `Idioma preferido: ${guild.preferredLocale}\n`
            + `Características: ${guild.features.join(', ') || 'Ninguna'}`;
    }

    static async cleanupFile(filePath) {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
            console.error('[dumpExporter] Error al limpiar archivo temporal:', err);
        }
    }
}

module.exports = DumpExporter;
