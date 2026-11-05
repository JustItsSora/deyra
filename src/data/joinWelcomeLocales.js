// src/data/joinWelcomeLocales.js
// Textos del panel que se envía cuando Deyra se une a un servidor nuevo.
// Idiomas elegidos por ser los más comunes entre servidores de Discord
// (misma lista de locales que expone discord.js/la API de Discord).

const { emoji } = require('../lib/emojis');

// Nota: se arma como función para que los emojis (que dependen del cache de
// emojis subidos) se resuelvan en el momento de mostrar el panel, no al
// cargar el módulo.
function getLocales() {
    return {
        es: {
            flag: '🇪🇸',
            label: 'Español',
            selectPlaceholder: 'Elegí un idioma / Choose a language',
            title: `${emoji('WAVE') || '👋'} ¡Gracias por invitar a Deyra!`,
            intro: 'Soy un bot todo-en-uno para tu servidor. Antes de nada, elegí tu idioma preferido abajo.',
            featuresTitle: '¿Qué trae Deyra?',
            features: [
                `${emoji('SHIELD')} **Moderación completa** — ban, kick, warns, automod y logs.`,
                `${emoji('MUSIC')} **Música** — reproducí desde YouTube, Spotify y más.`,
                `${emoji('CROWN')} **Economía y niveles** — sistema de XP, monedas y tienda.`,
                `${emoji('SUPPORT')} **Tickets** — soporte organizado por canales privados.`,
                `${emoji('WAVE') || '👋'} **Bienvenidas** — mensajes automáticos para nuevos miembros.`,
                `${emoji('YES')} **Y mucho más** — más de 470 comandos disponibles.`,
            ],
            help: 'Usá `/help` para ver todos los comandos, organizados por categoría.',
            footer: 'Podés cambiar el idioma de este panel cuando quieras volviendo a invitar o usando el selector de abajo.',
        },
        'en-US': {
            flag: '🇺🇸',
            label: 'English',
            selectPlaceholder: 'Elegí un idioma / Choose a language',
            title: `${emoji('WAVE') || '👋'} Thanks for inviting Deyra!`,
            intro: "I'm an all-in-one bot for your server. First, pick your preferred language below.",
            featuresTitle: 'What does Deyra bring?',
            features: [
                `${emoji('SHIELD')} **Full moderation** — ban, kick, warns, automod and logs.`,
                `${emoji('MUSIC')} **Music** — play from YouTube, Spotify and more.`,
                `${emoji('CROWN')} **Economy & levels** — XP system, currency and shop.`,
                `${emoji('SUPPORT')} **Tickets** — organized support via private channels.`,
                `${emoji('WAVE') || '👋'} **Welcome messages** — automatic greetings for new members.`,
                `${emoji('YES')} **And much more** — over 470 commands available.`,
            ],
            help: 'Use `/help` to see every command, organized by category.',
            footer: 'You can change this panel\'s language anytime using the menu below.',
        },
        de: {
            flag: '🇩🇪',
            label: 'Deutsch',
            selectPlaceholder: 'Elegí un idioma / Choose a language',
            title: `${emoji('WAVE') || '👋'} Danke, dass du Deyra eingeladen hast!`,
            intro: 'Ich bin ein All-in-One-Bot für deinen Server. Wähl zuerst deine bevorzugte Sprache unten aus.',
            featuresTitle: 'Was bietet Deyra?',
            features: [
                `${emoji('SHIELD')} **Vollständige Moderation** — Ban, Kick, Verwarnungen, Automod und Logs.`,
                `${emoji('MUSIC')} **Musik** — Abspielen von YouTube, Spotify und mehr.`,
                `${emoji('CROWN')} **Wirtschaft & Level** — XP-System, Währung und Shop.`,
                `${emoji('SUPPORT')} **Tickets** — organisierter Support über private Kanäle.`,
                `${emoji('WAVE') || '👋'} **Willkommensnachrichten** — automatische Begrüßung neuer Mitglieder.`,
                `${emoji('YES')} **Und vieles mehr** — über 470 verfügbare Befehle.`,
            ],
            help: 'Nutze `/help`, um alle Befehle nach Kategorie sortiert zu sehen.',
            footer: 'Du kannst die Sprache dieses Panels jederzeit über das Menü unten ändern.',
        },
        fr: {
            flag: '🇫🇷',
            label: 'Français',
            selectPlaceholder: 'Elegí un idioma / Choose a language',
            title: `${emoji('WAVE') || '👋'} Merci d'avoir invité Deyra !`,
            intro: 'Je suis un bot tout-en-un pour ton serveur. Choisis d\'abord ta langue préférée ci-dessous.',
            featuresTitle: 'Que propose Deyra ?',
            features: [
                `${emoji('SHIELD')} **Modération complète** — ban, kick, avertissements, automod et logs.`,
                `${emoji('MUSIC')} **Musique** — joue depuis YouTube, Spotify et plus.`,
                `${emoji('CROWN')} **Économie et niveaux** — système d'XP, monnaie et boutique.`,
                `${emoji('SUPPORT')} **Tickets** — support organisé via des canaux privés.`,
                `${emoji('WAVE') || '👋'} **Messages de bienvenue** — accueil automatique des nouveaux membres.`,
                `${emoji('YES')} **Et bien plus** — plus de 470 commandes disponibles.`,
            ],
            help: 'Utilise `/help` pour voir toutes les commandes, classées par catégorie.',
            footer: 'Tu peux changer la langue de ce panneau à tout moment avec le menu ci-dessous.',
        },
        'pt-BR': {
            flag: '🇧🇷',
            label: 'Português',
            selectPlaceholder: 'Elegí un idioma / Choose a language',
            title: `${emoji('WAVE') || '👋'} Obrigado por convidar a Deyra!`,
            intro: 'Sou um bot tudo-em-um para o seu servidor. Primeiro, escolha seu idioma preferido abaixo.',
            featuresTitle: 'O que a Deyra traz?',
            features: [
                `${emoji('SHIELD')} **Moderação completa** — ban, kick, avisos, automod e logs.`,
                `${emoji('MUSIC')} **Música** — toque do YouTube, Spotify e mais.`,
                `${emoji('CROWN')} **Economia e níveis** — sistema de XP, moedas e loja.`,
                `${emoji('SUPPORT')} **Tickets** — suporte organizado por canais privados.`,
                `${emoji('WAVE') || '👋'} **Boas-vindas** — mensagens automáticas para novos membros.`,
                `${emoji('YES')} **E muito mais** — mais de 470 comandos disponíveis.`,
            ],
            help: 'Use `/help` para ver todos os comandos, organizados por categoria.',
            footer: 'Você pode mudar o idioma deste painel quando quiser com o menu abaixo.',
        },
        ru: {
            flag: '🇷🇺',
            label: 'Русский',
            selectPlaceholder: 'Elegí un idioma / Choose a language',
            title: `${emoji('WAVE') || '👋'} Спасибо, что пригласили Deyra!`,
            intro: 'Я универсальный бот для вашего сервера. Для начала выберите язык ниже.',
            featuresTitle: 'Что умеет Deyra?',
            features: [
                `${emoji('SHIELD')} **Полная модерация** — бан, кик, предупреждения, automod и логи.`,
                `${emoji('MUSIC')} **Музыка** — воспроизведение с YouTube, Spotify и других.`,
                `${emoji('CROWN')} **Экономика и уровни** — система опыта, валюта и магазин.`,
                `${emoji('SUPPORT')} **Тикеты** — организованная поддержка через приватные каналы.`,
                `${emoji('WAVE') || '👋'} **Приветствия** — автоматические сообщения для новых участников.`,
                `${emoji('YES')} **И многое другое** — более 470 доступных команд.`,
            ],
            help: 'Используйте `/help`, чтобы увидеть все команды по категориям.',
            footer: 'Вы можете изменить язык этой панели в любой момент с помощью меню ниже.',
        },
    };
}

const LANGUAGE_ORDER = ['es', 'en-US', 'de', 'fr', 'pt-BR', 'ru'];

module.exports = { getLocales, LANGUAGE_ORDER };
