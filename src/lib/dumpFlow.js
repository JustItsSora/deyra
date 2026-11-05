// src/lib/dumpFlow.js
// Flujo compartido por todos los comandos /dump*: mensaje de "generando...",
// crear el archivo, mandarlo por DM a quien lo pidió, y limpiar el archivo
// temporal. Cada comando solo define permiso requerido + cómo generar el
// contenido.

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, FileBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { reply, isSlash, getUser, replyAndGetMessage } = require('./reply');
const { infoPanel, successPanel, errorPanel } = require('./panel');
const DumpExporter = require('./dumpExporter');

/**
 * @param {object} opts
 * @param {string} opts.label - Nombre legible de lo que se exporta (ej: "baneos").
 * @param {string} opts.fileKey - Prefijo del nombre de archivo (ej: "bans").
 * @param {(ctx) => Promise<{content: string, count: number}>} opts.generate
 */
async function runDump(ctx, { label, fileKey, generate }) {
    const loadingPayload = infoPanel('Generando exportación', `Exportando ${label}...`);
    const loadingMsg = await replyAndGetMessage(ctx, loadingPayload);

    let filePath;
    try {
        const { content, count } = await generate(ctx);
        const { path: tempPath, filename } = await DumpExporter.createDumpFile(fileKey, content);
        filePath = tempPath;

        const attachment = new AttachmentBuilder(tempPath, { name: filename });
        const user = getUser(ctx);

        const dmContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 📦 Exportación de ${label}`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Acá tenés ${count} ${label} de **${ctx.guild.name}**.`))
            .addFileComponents(new FileBuilder().setURL(`attachment://${filename}`));

        await user.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2, files: [attachment] });

        const donePayload = { ...successPanel('Archivo enviado', `La exportación de ${label} se envió a tus mensajes directos.`), flags: MessageFlags.IsComponentsV2 };
        if (loadingMsg) await loadingMsg.edit(donePayload).catch(() => {});
        else await reply(ctx, donePayload);
    } catch (err) {
        const message = err.code === 50007
            ? 'No pude enviarte un DM. Habilitá los mensajes directos de miembros del servidor.'
            : `No se pudo exportar ${label}: ${err.message}`;

        const failPayload = { ...errorPanel('Error al exportar', message), flags: MessageFlags.IsComponentsV2 };
        if (loadingMsg) await loadingMsg.edit(failPayload).catch(() => {});
        else await reply(ctx, failPayload);
    } finally {
        if (filePath) await DumpExporter.cleanupFile(filePath);
    }
}

module.exports = { runDump };
