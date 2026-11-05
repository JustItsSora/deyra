// src/lib/pagination.js
// Sesión de paginación genérica con botones. La usan las galerías de imágenes
// (/pfpboy, /anime, /freegames), el ranking de niveles y cualquier listado
// largo de resultados.
//
// Qué garantiza esta versión:
//   · El render es un ARRAY de containers (el sistema de diseño puede partir
//     un panel en varios si el contenido no entra en uno).
//   · Nunca manda `flags: IsComponentsV2` con `content`: Discord rechaza esa
//     mezcla.
//   · Al expirar, los botones se deshabilitan solos (un panel con botones
//     muertos es peor que un panel sin botones).
//   · Solo quien abrió la sesión puede paginar; los demás reciben un aviso
//     efímero en vez de un error silencioso.

const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags,
    ContainerBuilder,
} = require('discord.js');
const { randomUUID } = require('crypto');

const COLLECTOR_TIMEOUT = 300000; // 5 minutos
const MAX_TOP_LEVEL = 10;       // máximo de componentes de primer nivel
const MAX_CHILDREN = 10;        // máximo de hijos dentro de un container

function createPaginationSession(options) {
    const {
        interactionOrMessage,
        pages,
        renderPage,
        userId = null,
        initialPage = 0,
        timeout = COLLECTOR_TIMEOUT,
        ephemeral = false,
        onPageChange = null,
        totalPages = null,
    } = options;

    if (!interactionOrMessage) throw new Error('interactionOrMessage es requerido');
    if (!pages) throw new Error('pages es requerido');
    if (typeof renderPage !== 'function') throw new Error('renderPage debe ser una función');

    const sessionId = randomUUID().substring(0, 8);

    const state = {
        currentPage: Math.max(0, initialPage),
        totalPages: totalPages !== null ? totalPages : (Array.isArray(pages) ? pages.length : 0),
        sessionId,
        userId,
        collector: null,
        message: null,
    };

    async function getPageData(pageIndex) {
        if (Array.isArray(pages)) return pages[pageIndex];
        if (typeof pages === 'function') return pages(pageIndex);
        throw new Error('pages debe ser un array o una función');
    }

    /**
     * Normaliza lo que devuelve renderPage: acepta un ContainerBuilder, un
     * array de containers o un payload completo ({components, flags}).
     *
     * OJO con el caso de un builder suelto: `ContainerBuilder` también tiene
     * una propiedad `components` (sus HIJOS), así que mirar solo eso devolvía
     * los hijos del container en vez del container. Después `attachButtons`
     *intentaba meter una ActionRow encima de un TextDisplay y se rompía con
     * "Cannot read properties of undefined (reading 'length')".
     * Por eso la primera pregunta es: ¿esto es un builder?
     */
    function normalizeContainers(rendered) {
        if (!rendered) return [];
        if (Array.isArray(rendered)) return rendered;
        // Un builder (ContainerBuilder, ActionRowBuilder, ...) tiene toJSON().
        if (typeof rendered.toJSON === 'function') return [rendered];
        // Un payload plano {components: [...]}.
        if (Array.isArray(rendered.components)) return rendered.components;
        return [rendered];
    }

    async function renderContainer(pageIndex) {
        const pageData = await getPageData(pageIndex);
        const rendered = await renderPage(pageIndex, pageData, state);
        return normalizeContainers(rendered);
    }

    function buttonsRow(currentPage) {
        const total = state.totalPages;
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${sessionId}_first`).setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
            new ButtonBuilder().setCustomId(`${sessionId}_prev`).setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
            new ButtonBuilder().setCustomId(`${sessionId}_next`).setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(currentPage >= total - 1),
            new ButtonBuilder().setCustomId(`${sessionId}_last`).setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(currentPage >= total - 1),
        );
    }

    /** Cuántos hijos tiene un container (builder o JSON plano). */
    function childCount(container) {
        if (!container) return 0;
        const json = typeof container.toJSON === 'function' ? container.toJSON() : container;
        return Array.isArray(json?.components) ? json.components.length : 0;
    }

    /** Un container vacío del mismo estilo que el último (para la fila extra). */
    function emptyLike(container) {
        if (container && typeof container.toJSON === 'function') {
            const holder = new ContainerBuilder();
            const accent = container.data?.accent_color;
            if (accent !== undefined && accent !== null) holder.setAccentColor(accent);
            return holder;
        }
        const json = typeof container?.toJSON === 'function' ? container.toJSON() : (container || {});
        const holder = { type: 17, components: [] };
        if (json.accent_color !== undefined) holder.accent_color = json.accent_color;
        return holder;
    }

    /** Mete la fila de botones en el container (builder o JSON plano). */
    function addRow(container, row) {
        if (typeof container.addActionRowComponents === 'function') {
            container.addActionRowComponents(row);
            return container;
        }
        // Container en JSON plano: se le agrega la fila ya serializada.
        if (!Array.isArray(container.components)) container.components = [];
        container.components.push(row.toJSON());
        return container;
    }

    /** Saca el último hijo de un container (builder o JSON plano). */
    function dropLastChild(container) {
        if (typeof container.addActionRowComponents === 'function') {
            const json = container.toJSON();
            const children = json.components || [];
            if (children.length <= 1) return container;
            // Los builders de discord.js no tienen "remove child", así que se
            // reconstruye el container con los hijos que quedan.
            const holder = new ContainerBuilder();
            const accent = container.data?.accent_color;
            if (accent !== undefined && accent !== null) holder.setAccentColor(accent);
            holder.spliceComponents(0, 0, ...children.slice(0, -1));
            return holder;
        }
        if (Array.isArray(container.components) && container.components.length > 1) {
            container.components.pop();
        }
        return container;
    }

    /**
     * Los botones van como último hijo del último container. Si el panel ya
     * tiene 10 componentes (el tope de Discord), se agrega un container
     * extra solo para los botones en vez de pasarse del límite.
     */
    function attachButtons(containers) {
        if (state.totalPages <= 1) return containers;
        const list = [...containers];
        if (!list.length) list.push(new ContainerBuilder());

        const row = buttonsRow(state.currentPage);
        const last = list[list.length - 1];

        if (childCount(last) >= MAX_CHILDREN) {
            if (list.length < MAX_TOP_LEVEL) {
                // Entra un container nuevo: la fila va sola.
                list.push(emptyLike(last));
            } else {
                // Ya no entran containers arriba: se sacrifica el último hijo
                // del último container (suele ser el pie) para hacer lugar.
                list[list.length - 1] = dropLastChild(last);
            }
        }

        addRow(list[list.length - 1], row);
        return list;
    }

    function payloadFor(containers) {
        return { components: containers, flags: MessageFlags.IsComponentsV2 };
    }

    async function renderInitial() {
        const containers = attachButtons(await renderContainer(state.currentPage));
        const payload = payloadFor(containers);

        const ctx = interactionOrMessage;
        const isInteraction = typeof ctx.isCommand === 'function' && ctx.isCommand();
        let message;
        if (ctx.deferred || ctx.replied) {
            message = await ctx.editReply(payload);
        } else if (typeof ctx.reply === 'function') {
            const options = {
                ...payload,
                allowedMentions: { users: [] },
            };
            if (isInteraction) {
                // `fetchReply` está deprecado en discord.js v14.16: el camino
                // viejo es `withResponse: true` + `.resource.message`.
                options.withResponse = true;
                if (ephemeral) options.flags |= MessageFlags.Ephemeral;
            }
            const response = await ctx.reply(options);
            message = response?.resource?.message || response;
        } else if (ctx.channel?.send) {
            message = await ctx.channel.send(payload);
        } else {
            throw new Error('No se encontró un método para enviar el mensaje');
        }

        if (state.totalPages > 1) attachCollector(message);
        return message;
    }

    function attachCollector(message) {
        if (!message || state.totalPages <= 1) return;

        const filter = (i) => {
            if (!i.customId.startsWith(sessionId)) return false;
            if (userId && i.user.id !== userId) {
                i.reply({ content: '🔒 No podés interactuar con esta paginación.', flags: MessageFlags.Ephemeral }).catch(() => {});
                return false;
            }
            return true;
        };

        state.collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: timeout });

        state.collector.on('collect', async (i) => {
            const action = i.customId.split('_')[1];
            let next = state.currentPage;
            if (action === 'first') next = 0;
            else if (action === 'prev') next = Math.max(0, state.currentPage - 1);
            else if (action === 'next') next = Math.min(state.totalPages - 1, state.currentPage + 1);
            else if (action === 'last') next = state.totalPages - 1;
            else return;

            try {
                state.currentPage = next;
                if (onPageChange) await onPageChange(next, state);
                const containers = attachButtons(await renderContainer(next));
                await i.update(payloadFor(containers));
            } catch (err) {
                console.error(`[pagination] Error cambiando de página:`, err.message);
                await i.reply({ content: '⚠️ No pude cambiar de página. Probá de nuevo.', flags: MessageFlags.Ephemeral }).catch(() => {});
            }
        });

        state.collector.on('end', async () => {
            try {
                // Deshabilitamos los botones: ya no hay collector que los atienda.
                const fresh = await message.edit({ components: attachButtons(await renderContainer(state.currentPage)).map(disableButtons) }).catch(() => null);
                if (fresh) return;
                const json = message.components.map(disableButtons);
                await message.edit({ components: json }).catch(() => {});
            } catch (_) { /* el mensaje puede haberse borrado */ }
        });
    }

    function stop() {
        if (state.collector) state.collector.stop();
    }

    function getState() {
        return { currentPage: state.currentPage, totalPages: state.totalPages, sessionId };
    }

    return { renderInitial, attachCollector, stop, getState };
}

/**
 * Copia un container con todas sus filas de botones deshabilitadas.
 * Works both for action rows (type 1) and containers (type 17): a container
 * holds its rows inside `components`, so the buttons have to be disabled
 * from there or they stay clickable after the session ends.
 */
function disableButtons(container) {
    const json = typeof container.toJSON === 'function' ? container.toJSON() : container;
    if (!json || typeof json !== 'object') return json;
    if (json.type === 17) {
        // Container: se deshabilita lo que haya adentro.
        if (!Array.isArray(json.components)) return json;
        return { ...json, components: json.components.map(disableButtons) };
    }
    if (json.type !== 1) return json;
    if (!Array.isArray(json.components)) return json;
    return {
        ...json,
        components: json.components.map((button) => ({ ...button, disabled: true })),
    };
}

module.exports = { createPaginationSession };
