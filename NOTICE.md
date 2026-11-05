# NOTICE — atribuciones y licencias de terceros

Deyra es software libre. Este archivo dice de dónde viene cada parte que no
es original, porque es un requisito de las licencias de los proyectos de los que
se portó código, y además porque saber qué se copió es lo primero que
alguien va a preguntar si esto alguna vez se comparte.

---

## Módulo de música: derivado de Eleven Music

**Qué se usó:** el diseño de filtros de audio, el panel de reproducción con
controles, la estructura de los datos de música (configuración por servidor,
playlists, favoritos, historial, 24/7, fairplay) y el receptor de webhooks de
top.gg.

**De dónde viene:**

- Proyecto: [Eleven Music](https://github.com/openUwU/eleven)
- Autoría: el proyecto OpenUwU (`@priyanshu`, `@prayag`, `@bre4d777`,
  `@mooncarli`)
- Licencia declarada por ese proyecto: `OUSL-1.0` en su `package.json`

**Aviso de copyright que se conserva** (el que el proyecto original pedía
mantener en cada archivo):

```
Credits: The OpenUwU Project
Owners: @priyanshu @prayag
Author:  @bre4d777 and @mooncarli
github.com/openUwU/
```

### Lo que SÍ se conservó y lo que NO

Se conservó la atribución y se borraron las referencias al proyecto original
en la interfaz del bot: no hay links a su repositorio, ni a su documentación, ni
invitaciones a su servidor de soporte, ni sus emojis, ni sus identificadores de
top.gg en ningún comando. Eso está en `/credits` y acá, no en `/botinfo`.

### Advertencia honesta sobre la licencia

El proyecto del que viene este código **no tiene archivo LICENSE**. El
identificador `OUSL-1.0` que declara en su `package.json` no existe en el
registro SPDX, y sus cabeceras por archivo se inyectan automáticamente con un
hook de git, lo que sugiere código fuente disponible con atribución obligatoria
más que open source sin restricciones.

Mientras no se aclare el texto exacto de la licencia:

- Deyra se considera derivado y por eso se publica el código fuente completo.
- No se ofrece como servicio pago ni se monetiza el código.
- Cualquiera que quiera usar este proyecto tiene que leer esta sección y no dar
  por hecho que puede comercializarlo.

Si tenés el texto real de la licencia y es más permisiva, actualizá esta sección
y `package.json`.

---

## Otras atribuciones

**Deyra es un proyecto propio.** Todo lo demás — moderación, tickets, automod,
economía, niveles, diversión, utilidad, el sistema de diseño de paneles, el
cargador de comandos, la capa de base de datos— es original de este proyecto y
está bajo la licencia del `package.json`.

**Dependencias:** cada dependencia mantiene su propia licencia (discord.js, MIT;
kazagumo y shoukaku, MIT; sequelize, MIT; entre otras). Los avisos de copyright
de cada una se distribuyen con sus paquetes en `node_modules/`.

**Emojis:** los emojis de aplicación que usa el bot salen de los packs en
`assets/emojis/` (blueicons y ticks), que se suben a Discord como emojis de la
propia aplicación. No se usa ningún emoji de terceros.
