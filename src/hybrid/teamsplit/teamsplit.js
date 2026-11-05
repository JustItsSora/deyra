const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('teamsplit')
        .setDescription('Divide una lista de nombres en N equipos balanceados')
        .addStringOption(o => o.setName('nombres').setDescription('Nombres separados por comas').setRequired(true))
        .addIntegerOption(o => o.setName('equipos').setDescription('Número de equipos').setMinValue(2).setMaxValue(10).setRequired(true)),

    name: 'teamsplit',
    aliases: ['dividirequipos'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let raw, teamCount;
        if (isSlash(ctx)) {
            raw = ctx.options.getString('nombres');
            teamCount = ctx.options.getInteger('equipos');
        } else {
            raw = args.slice(0, -1).join(' ');
            teamCount = parseInt(args[args.length - 1], 10);
        }

        if (!raw || !teamCount) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica nombres y número de equipos.'), ephemeral: true });
        }

        const names = raw.split(',').map(n => n.trim()).filter(Boolean).sort(() => Math.random() - 0.5);
        if (names.length < teamCount) {
            return reply(ctx, { ...errorPanel('No hay suficientes', 'Necesitas al menos un nombre por equipo.'), ephemeral: true });
        }

        const teams = Array.from({ length: teamCount }, () => []);
        names.forEach((name, i) => teams[i % teamCount].push(name));

        const lines = teams.map((team, i) => `**Equipo ${i + 1}:** ${team.join(', ')}`);
        return reply(ctx, infoPanel('👥 Equipos formados', undefined, { lines }));
    },
};
