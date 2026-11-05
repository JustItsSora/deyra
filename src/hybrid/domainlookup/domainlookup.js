const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('domainlookup')
        .setDescription('Verifica el estado y resuelve la IP de un dominio')
        .addStringOption(o => o.setName('dominio').setDescription('Ej: google.com').setRequired(true)),

    name: 'domainlookup',
    aliases: ['dominio'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const domain = (isSlash(ctx) ? ctx.options.getString('dominio') : args[0])?.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!domain) {
            return reply(ctx, { ...errorPanel('Falta el dominio', 'Especifica un dominio, ej: `google.com`.'), ephemeral: true });
        }

        try {
            // Usa DNS-over-HTTPS de Cloudflare, público y gratuito, sin key.
            const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
                headers: { Accept: 'application/dns-json' },
            });
            if (!res.ok) throw new Error(`dns query ${res.status}`);
            const data = await res.json();

            const answers = data.Answer?.filter(a => a.type === 1) || [];
            if (answers.length === 0) {
                return reply(ctx, { ...errorPanel('No resuelto', 'Ese dominio no tiene registros A o no existe.'), ephemeral: true });
            }

            const ips = answers.map(a => a.data).join(', ');
            return reply(ctx, infoPanel(`Dominio: ${domain}`, `**IP(s):** ${ips}`));
        } catch (err) {
            console.error('[domainlookup] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude resolver ese dominio.'), ephemeral: true });
        }
    },
};
