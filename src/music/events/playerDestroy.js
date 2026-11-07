module.exports = {
  name: 'playerDestroy',
  run: async (client, player) => {
    try {
      const guild = client.guilds.cache.get(player.guildId);

      if (player.voiceId) {
        client.rest.put(`/channels/${player.voiceId}/voice-status`, { body: { status: '' } }).catch(() => {});
      }

      const existingTimeout = player.data?.get('disconnectTimeout');
      if (existingTimeout) clearTimeout(existingTimeout);

      const emptyTimeout = player.data?.get('emptyChannelTimeout');
      if (emptyTimeout) clearTimeout(emptyTimeout);

      const msg = player.data?.get('message');
      if (msg?.deletable) await msg.delete().catch(() => {});

      if (player.queue?.previous) player.queue.previous = [];

      player.data?.clear();
    } catch (_) {}
  }
};
