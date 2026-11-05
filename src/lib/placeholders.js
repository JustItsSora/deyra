// src/lib/placeholders.js
function fillPlaceholders(template, { member, guild }) {
    return template
        .replace(/\{user\}/g, member.toString())
        .replace(/\{username\}/g, member.user.username)
        .replace(/\{server\}/g, guild.name)
        .replace(/\{membercount\}/g, guild.memberCount.toString());
}

module.exports = { fillPlaceholders };
