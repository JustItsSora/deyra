const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { Tag } = require('../../data/models');
const { hasPermission } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Gestiona respuestas guardadas del servidor')
        .addSubcommand(s => s.setName('create').setDescription('Crea una nueva tag')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre de la tag').setRequired(true))
            .addStringOption(o => o.setName('contenido').setDescription('Contenido de la tag').setRequired(true)))
        .addSubcommand(s => s.setName('get').setDescription('Muestra una tag')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre de la tag').setRequired(true)))
        .addSubcommand(s => s.setName('delete').setDescription('Elimina una tag')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre de la tag').setRequired(true)))
        .addSubcommand(s => s.setName('list').setDescription('Lista todas las tags del servidor')),

    name: 'tag',
    aliases: [],
    category: 'utilidad',

    async execute(ctx, args = []) {
        const isSlashCtx = isSlash(ctx);
        let subcommand;

        if (isSlashCtx) {
            subcommand = ctx.options.getSubcommand();
        } else {
            const knownSubs = ['create', 'get', 'delete', 'list'];
            if (knownSubs.includes(args[0]?.toLowerCase())) {
                subcommand = args[0].toLowerCase();
                args = args.slice(1);
            } else {
                subcommand = 'get';
            }
        }

        if (subcommand === 'create') {
            const name = isSlashCtx ? ctx.options.getString('nombre').toLowerCase() : args[0]?.toLowerCase();
            const content = isSlashCtx ? ctx.options.getString('contenido') : args.slice(1).join(' ');

            if (!name || !content) {
                return reply(ctx, { ...errorPanel('Faltan datos', 'Especifica un nombre y contenido.'), ephemeral: true });
            }

            const existing = await Tag.findOne({ where: { guildId: ctx.guild.id, name } });
            if (existing) {
                return reply(ctx, { ...errorPanel('Ya existe', 'Ya hay una tag con ese nombre.'), ephemeral: true });
            }

            await Tag.create({ guildId: ctx.guild.id, name, content, authorId: getUserId(ctx) });
            return reply(ctx, successPanel('Tag creada', `La tag \`${name}\` fue creada.`));
        }

        if (subcommand === 'delete') {
            const name = isSlashCtx ? ctx.options.getString('nombre').toLowerCase() : args[0]?.toLowerCase();
            const tag = await Tag.findOne({ where: { guildId: ctx.guild.id, name } });

            if (!tag) return reply(ctx, { ...errorPanel('No encontrada', 'No existe una tag con ese nombre.'), ephemeral: true });

            const executorId = getUserId(ctx);
            const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
            if (tag.authorId !== executorId && !hasPermission(executor, PermissionFlagsBits.ManageGuild)) {
                return reply(ctx, { ...errorPanel('Sin permisos', 'Solo el creador de la tag o un administrador puede eliminarla.'), ephemeral: true });
            }

            await tag.destroy();
            return reply(ctx, successPanel('Tag eliminada', `La tag \`${name}\` fue eliminada.`));
        }

        if (subcommand === 'list') {
            const tags = await Tag.findAll({ where: { guildId: ctx.guild.id }, order: [['uses', 'DESC']], limit: 30 });
            if (tags.length === 0) return reply(ctx, infoPanel('Tags', 'Este servidor no tiene tags todavía.'));

            const lines = tags.map(t => `\`${t.name}\` — ${t.uses} uso(s)`);
            return reply(ctx, infoPanel('Tags del servidor', undefined, { lines }));
        }

        // get (default)
        const name = isSlashCtx ? ctx.options.getString('nombre').toLowerCase() : args[0]?.toLowerCase();
        const tag = await Tag.findOne({ where: { guildId: ctx.guild.id, name } });
        if (!tag) return reply(ctx, { ...errorPanel('No encontrada', 'No existe una tag con ese nombre.'), ephemeral: true });

        tag.uses += 1;
        await tag.save();
        return reply(ctx, { content: tag.content });
    },
};
