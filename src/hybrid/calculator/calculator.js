const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// Evaluador seguro de expresiones aritméticas simples, sin usar eval().
// Soporta + - * / ( ) y decimales.
function safeEvaluate(expr) {
    const sanitized = expr.replace(/\s+/g, '');
    if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
        throw new Error('Expresión contiene caracteres no permitidos');
    }

    let index = 0;
    function parseExpr() {
        let value = parseTerm();
        while (sanitized[index] === '+' || sanitized[index] === '-') {
            const op = sanitized[index++];
            const rhs = parseTerm();
            value = op === '+' ? value + rhs : value - rhs;
        }
        return value;
    }
    function parseTerm() {
        let value = parseFactor();
        while (sanitized[index] === '*' || sanitized[index] === '/') {
            const op = sanitized[index++];
            const rhs = parseFactor();
            value = op === '*' ? value * rhs : value / rhs;
        }
        return value;
    }
    function parseFactor() {
        if (sanitized[index] === '(') {
            index++;
            const value = parseExpr();
            if (sanitized[index] !== ')') throw new Error('Paréntesis sin cerrar');
            index++;
            return value;
        }
        if (sanitized[index] === '-') {
            index++;
            return -parseFactor();
        }
        const start = index;
        while (index < sanitized.length && /[0-9.]/.test(sanitized[index])) index++;
        if (start === index) throw new Error('Número esperado');
        return parseFloat(sanitized.slice(start, index));
    }

    const result = parseExpr();
    if (index !== sanitized.length) throw new Error('Expresión mal formada');
    if (Number.isNaN(result) || !Number.isFinite(result)) throw new Error('Resultado inválido');
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculator')
        .setDescription('Evalúa una expresión matemática simple')
        .addStringOption(o => o.setName('expresion').setDescription('Ej: (2+3)*4/2').setRequired(true)),

    name: 'calculator',
    aliases: ['calc'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const expr = isSlash(ctx) ? ctx.options.getString('expresion') : args.join(' ');
        if (!expr) {
            return reply(ctx, { ...errorPanel('Falta la expresión', 'Especifica una expresión matemática.'), ephemeral: true });
        }

        try {
            const result = safeEvaluate(expr);
            return reply(ctx, infoPanel('🧮 Calculadora', `\`${expr}\` = **${result}**`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('Expresión inválida', 'Solo se permiten números, `+ - * / ( )`.'), ephemeral: true });
        }
    },
};
