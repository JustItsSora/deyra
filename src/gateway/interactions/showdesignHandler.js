// src/gateway/interactions/showdesignHandler.js
// Selector de /showdesign: muestra el ejemplo del bloque elegido.
// El comando exporta su propia función para no duplicar la lógica de owner.

const showdesign = require('../../hybrid/showdesign/showdesign');

module.exports = {
    async handle(interaction) {
        return showdesign.handleSelectComponent(interaction);
    },
};
