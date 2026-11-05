// Se emite cuando Lavalink reanuda una pista pausada (evento 'resumed').
// Kazagumo lo propaga con el player; Deyra solo necesita dejar el estado de
// voz coherente y marcar el momento para el panel.

module.exports = {
  name: 'playerResumed',
  run: async (client, player) => {
    try {
      if (!player) return;
      player.data?.set('resumedAt', Date.now());

      const track = player.queue?.current;
      if (track && player.voiceId && player.state !== 'DESTROYED' && player.state !== 'DISCONNECTED') {
        await client.rest.put(`/channels/${player.voiceId}/voice-status`, {
          body: { status: `Reproduciendo: ${track.title}`.slice(0, 500) },
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[playerResumed] Error:', err.message);
    }
  },
};
