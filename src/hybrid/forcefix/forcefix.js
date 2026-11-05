// src/hybrid/forcefix/forcefix.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { reply, getMember, isSlash, replyAndGetMessage } = require('../../lib/reply');
const { infoPanel, successPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel } = require('../../music/lib/musicChecks');
const { safeDestroyPlayer } = require('../../music/utils/playerUtils');

function delay(msVal) {
    return new Promise((resolve) => setTimeout(resolve, msVal));
}

async function fullFix(client, guildId, voiceChannel) {
    const existingPlayer = client.music.players.get(guildId);
    if (existingPlayer) {
        await safeDestroyPlayer(existingPlayer);
    }

    try {
        const guild = client.guilds.cache.get(guildId);
        if (guild?.members?.me?.voice?.channel) {
            await guild.members.me.voice.setChannel(null);
        }
    } catch (_) {}

    await delay(3000);

    try {
        const guild = client.guilds.cache.get(guildId);
        if (guild && voiceChannel && guild.members.me) {
            await guild.members.me.voice.setChannel(voiceChannel).catch(() => {});
        }
    } catch (_) {}

    await delay(2000);

    try {
        if (client.user) {
            await client.rest.patch(`/guilds/${guildId}/voice-states/${client.user.id}`, {
                body: { channel_id: voiceChannel.id, suppress: false, request_to_speak_timestamp: null },
            });
        }
    } catch (_) {}
}

module.exports = {
    data: new SlashCommandBuilder().setName('forcefix').setDescription('Repara problemas de reproducción (bot trabado, no se conecta, etc.)'),

    name: 'forcefix',
    aliases: ['fix'],
    category: 'música',
    cooldownMs: 10000,

    async execute(ctx) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        if (!requireVoiceChannel(ctx)) return;

        const member = getMember(ctx);
        const voiceChannel = member.voice.channel;
        const guildId = ctx.guildId || ctx.guild?.id;

        const payload = infoPanel('Reparando el bot de música', 'Esperá un momento mientras se reinicia la conexión de voz...');
        const statusMsg = await replyAndGetMessage(ctx, payload);

        try {
            await fullFix(client, guildId, voiceChannel);
            const done = { ...successPanel('Listo', 'Se reinició la conexión de voz. Probá reproducir una canción de nuevo.'), flags: MessageFlags.IsComponentsV2 };
            if (statusMsg) await statusMsg.edit(done).catch(() => {});
            else await reply(ctx, done);
        } catch (error) {
            const failed = { ...errorPanel('No se pudo reparar', `Error: ${error.message}`), flags: MessageFlags.IsComponentsV2 };
            if (statusMsg) await statusMsg.edit(failed).catch(() => {});
            else await reply(ctx, failed);
        }
    },
};
