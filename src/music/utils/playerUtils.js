async function safeDestroyPlayer(player) {
  try {
    if (!player) return;
    if (player.state === 'DESTROYED') return;
    await player.destroy();
  } catch (_) {
    // already destroyed or connection lost — safe to ignore
  }
}

module.exports = { safeDestroyPlayer };
