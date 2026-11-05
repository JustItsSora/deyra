// src/lib/socialActions.js
//
// Catálogo de acciones sociales tipo "roleplay" (/hug, /kiss, /bonk, /spin...).
//
// Un solo lugar define, para cada acción:
//   do     → forma imperativa, la que ve el usuario en /help y en el autocompletado
//            de slash ("Abraza a alguien", "Hazle cosquillas a alguien").
//   verb   → tercera persona, como se lee dentro del panel ("Ryu abrazó a Mía").
//            Solo para acciones dirigidas.
//   emoji  → el símbolo que abre el panel.
//   solo   → si no necesita mencionar a otra persona.
//   withButtons → si la acción es lo bastante íntima como para que el receptor
//             pueda Aceptar o Rechazar.
//   gif    → la categoría real en la API. A veces no coincide con el nombre del
//             comando (/kill → "nom", /headpat → "pat").
//
// Agregar una acción nueva: una entrada acá + `npm run social:generate`.
// El generador crea el archivo de comando; no hay que escribirlo a mano.

const SOCIAL_ACTIONS = {
    // --- Acciones íntimas: con botones de Aceptar / Rechazar ---
    hug: {
        do: 'Abraza a alguien', label: 'un abrazo', verb: 'abrazó a',
        emoji: '🤗', withButtons: true, gif: 'hug',
    },
    kiss: {
        do: 'Besa a alguien', label: 'un beso', verb: 'besó a',
        emoji: '💋', withButtons: true, gif: 'kiss',
    },
    cuddle: {
        do: 'Acurrucate con alguien', label: 'un acurrucamiento', verb: 'se acurrucó con',
        emoji: '🥰', withButtons: true, gif: 'cuddle',
    },
    pat: {
        do: 'Acaricia a alguien', label: 'una caricia', verb: 'acarició a',
        emoji: '🫳', withButtons: true, gif: 'pat',
    },
    handhold: {
        do: 'Toma de la mano a alguien', label: 'tomarle la mano', verb: 'tomó de la mano a',
        emoji: '🤝', withButtons: true, gif: 'handhold',
    },
    lappillow: {
        do: 'Usa a alguien de almohada', label: 'usar de almohada', verb: 'usó a',
        emoji: '🛋️', withButtons: true, gif: 'lappillow',
    },
    kabedon: {
        do: 'Hazle un kabedon a alguien', label: 'un kabedon', verb: 'le hizo un kabedon a',
        emoji: '🧱', withButtons: true, gif: 'kabedon',
    },
    carry: {
        do: 'Carga a alguien en brazos', label: 'cargar en brazos', verb: 'cargó en brazos a',
        emoji: '🫂', withButtons: true, gif: 'carry',
    },
    headpat: {
        do: 'Hazle una caricia en la cabeza a alguien', label: 'una caricia en la cabeza', verb: 'le acarició la cabeza a',
        emoji: '🖐️', gif: 'pat',
    },
    blowkiss: {
        do: 'Sopla un beso a alguien', label: 'un beso al aire', verb: 'le sopló un beso a',
        emoji: '😘', gif: 'blowkiss',
    },

    // --- Acciones de una sola vía: van directas, sin botones ---
    slap: { do: 'Abofetea a alguien', verb: 'abofeteó a', emoji: '👋', gif: 'slap' },
    poke: { do: 'Pica a alguien', verb: 'picó a', emoji: '👉', gif: 'poke' },
    tickle: { do: 'Hazle cosquillas a alguien', verb: 'le hizo cosquillas a', emoji: '🤣', gif: 'tickle' },
    bite: { do: 'Muerde a alguien', verb: 'mordió a', emoji: '😬', gif: 'bite' },
    punch: { do: 'Golpea a alguien', verb: 'golpeó a', emoji: '🥊', gif: 'punch' },
    highfive: { do: 'Choca los cinco con alguien', verb: 'chocó los cinco con', emoji: '🙌', gif: 'highfive' },
    wave: { do: 'Saluda a alguien', verb: 'saludó a', emoji: '👋', gif: 'wave' },
    wink: { do: 'Guiña el ojo a alguien', verb: 'guiñó el ojo a', emoji: '😉', gif: 'wink' },
    lick: { do: 'Lame a alguien', verb: 'lamió a', emoji: '😝', gif: 'lick' },
    bonk: { do: 'Bonkea a alguien', verb: 'bonkeó a', emoji: '🔨', gif: 'bonk' },
    kill: { do: 'Elimina a alguien', verb: 'eliminó a', emoji: '💀', gif: 'nom' },
    yeet: { do: 'Lanza a alguien', verb: 'lanzó a', emoji: '🚀', gif: 'yeet' },
    feed: { do: 'Alimenta a alguien', verb: 'alimentó a', emoji: '🍽️', gif: 'feed' },
    nom: { do: 'Dale un mordisco a alguien', verb: 'le dio un mordisco a', emoji: '😋', gif: 'nom' },
    shoot: { do: 'Dispara a alguien', verb: 'le disparó a', emoji: '🔫', gif: 'shoot' },
    kick: { do: 'Patea a alguien', verb: 'pateó a', emoji: '🦵', gif: 'kick' },
    shake: { do: 'Sacude a alguien', verb: 'sacudió a', emoji: '🙌', gif: 'shake' },
    peck: { do: 'Dale un picotazo a alguien', verb: 'le dio un picotazo a', emoji: '🐦', gif: 'peck' },
    handshake: { do: 'Estréchale la mano a alguien', verb: 'se estrechó la mano con', emoji: '🤝', gif: 'handshake' },
    salute: { do: 'Saluda militarmente a alguien', verb: 'saludó militarmente a', emoji: '🫡', gif: 'salute' },
    fluff: { do: 'Esponja a alguien', verb: 'esponjó a', emoji: '🪶', gif: 'fluff' },
    lay: { do: 'Túmbate encima de alguien', verb: 'se tumbó encima de', emoji: '🛌', gif: 'lay' },
    tail: { do: 'Agita la cola a alguien', verb: 'agitó la cola a', emoji: '🐕', gif: 'tail' },
    highfive2: { do: 'Choca los cinco con alguien', verb: 'chocó los cinco con', emoji: '🙌', gif: 'highfive' },

    // --- Sin objetivo: no necesitan mencionar a nadie ---
    smile: { do: 'Sonríe', emoji: '😊', solo: true, gif: 'smile' },
    blush: { do: 'Sonrojate', emoji: '😳', solo: true, gif: 'blush' },
    cry: { do: 'Llora', emoji: '😢', solo: true, gif: 'cry' },
    dance: { do: 'Baila', emoji: '💃', solo: true, gif: 'dance' },
    happy: { do: 'Sé feliz', emoji: '😄', solo: true, gif: 'happy' },
    laugh: { do: 'Ríete', emoji: '😂', solo: true, gif: 'laugh' },
    pout: { do: 'Haz un gesto de enfado', emoji: '😤', solo: true, gif: 'pout' },
    smug: { do: 'Posea', emoji: '😏', solo: true, gif: 'smug' },
    stare: { do: 'Mirá fijo', emoji: '👀', solo: true, gif: 'stare' },
    think: { do: 'Pensá', emoji: '🤔', solo: true, gif: 'think' },
    thumbsup: { do: 'Dale el pulgar arriba', emoji: '👍', solo: true, gif: 'thumbsup' },
    run: { do: 'Corré', emoji: '🏃', solo: true, gif: 'run' },
    sleep: { do: 'Dormí', emoji: '😴', solo: true, gif: 'sleep' },
    baka: { do: 'Reíte de alguien', emoji: '😡', solo: true, gif: 'baka' },
    angry: { do: 'Ponete furioso', emoji: '😠', solo: true, gif: 'angry' },
    bored: { do: 'Aburrite', emoji: '🥱', solo: true, gif: 'bored' },
    clap: { do: 'Aplaudí', emoji: '👏', solo: true, gif: 'clap' },
    confused: { do: 'Quedate confundido', emoji: '😵‍💫', solo: true, gif: 'confused' },
    facepalm: { do: 'Date una palmada en la cara', emoji: '🤦', solo: true, gif: 'facepalm' },
    nod: { do: 'Asentí con la cabeza', emoji: '🙂', solo: true, gif: 'nod' },
    nope: { do: 'Decí que no', emoji: '🙅', solo: true, gif: 'nope' },
    shrug: { do: 'Encogete de hombros', emoji: '🤷', solo: true, gif: 'shrug' },
    sip: { do: 'Tomá un sorbo', emoji: '🥤', solo: true, gif: 'sip' },
    spin: { do: 'Girá', emoji: '🌀', solo: true, gif: 'spin' },
    tableflip: { do: 'Tirá la mesa', emoji: '💢', solo: true, gif: 'tableflip' },
    teehee: { do: 'Soltá una risa', emoji: '😆', solo: true, gif: 'teehee' },
    yawn: { do: 'Bostezá', emoji: '🥱', solo: true, gif: 'yawn' },
    wag: { do: 'Agitá la cola', emoji: '🐕', solo: true, gif: 'wag' },
    bleh: { do: 'Hacé una mueca de asco', emoji: '😒', solo: true, gif: 'bleh' },
    lurk: { do: 'Acechá', emoji: '👁️', solo: true, gif: 'lurk' },
    shock: { do: 'Quedate de piedra', emoji: '😱', solo: true, gif: 'shocked' },
    nya: { do: 'Decí "nya~"', emoji: '🐱', solo: true, gif: 'nya' },
    comfy: { do: 'Acomodate', emoji: '🛋️', solo: true, gif: 'comfy' },
    chonky: { do: 'Hacete un mimo', emoji: '🐳', solo: true, gif: 'cuddle' },
};

/** Frases para las acciones sin objetivo: el panel dice "Ryu está sonriendo". */
const SOLO_PHRASES = {
    smile: 'está sonriendo',
    blush: 'se puso rojo',
    cry: 'está llorando a mares',
    dance: 'se puso a bailar',
    happy: 'está feliz de la vida',
    laugh: 'se rió a carcajadas',
    pout: 'hizo un gesto de enfado',
    smug: 'tiene una expresión muy smug',
    stare: 'se quedó mirando fijo',
    think: 'se quedó pensando',
    thumbsup: 'dio el pulgar arriba',
    run: 'salió corriendo',
    sleep: 'se quedó dormido',
    baka: 'está que se lo pela',
    angry: 'está hecho una furia',
    bored: 'se está aburriendo muchísimo',
    clap: 'aplaudió',
    confused: 'no entiende nada',
    facepalm: 'se dio una palmada en la cara',
    nod: 'asintió con la cabeza',
    nope: 'dijo que ni a palos',
    shrug: 'se encogió de hombros',
    sip: 'tomó un sorbo',
    spin: 'empezó a girar',
    tableflip: 'tiró la mesa',
    teehee: 'soltó una risa contenida',
    yawn: 'bostezó',
    wag: 'agitó la cola',
    bleh: 'hizo una mueca de asco',
    lurk: 'está acechando',
    shock: 'se quedó de piedra',
    nya: 'dijo "nya~"',
    comfy: 'se acomodó cómodamente',
    chonky: 'se hizo un mimo',
};

/**
 * Acciones que funcionan bien dirigidas a uno mismo sin quedar raro. Lo íntimo
 * queda bloqueado (no podés darte un abrazo a vos mismo... ¿o sí?).
 */
const SELF_ALLOWED = new Set([
    'slap', 'poke', 'tickle', 'bite', 'punch', 'bonk', 'kill', 'yeet',
    'shoot', 'kick', 'shake', 'peck', 'feed', 'nom', 'headpat', 'blowkiss',
]);

/** Claves de acciones, sin los alias internos que solo evitan colisiones. */
const ALL_ACTIONS = Object.keys(SOCIAL_ACTIONS);

/** Acciones que el usuario puede invocar como comando (excluye alias internos). */
const PUBLIC_ACTIONS = ALL_ACTIONS.filter(key => !/(^highfive\d|_solo)$/.test(key));

module.exports = {
    SOCIAL_ACTIONS, SOLO_PHRASES, SELF_ALLOWED, ALL_ACTIONS, PUBLIC_ACTIONS,
};
