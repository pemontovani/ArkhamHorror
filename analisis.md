# Análisis del proyecto ArkhamHorror

> Repositorio original: <https://github.com/halogenandtoast/ArkhamHorror> (mantenedor principal: Matthew Mongeau / `halogenandtoast`, más de 10 000 commits; el resto son contribuciones de la comunidad).
> App en producción: <https://arkhamhorror.app>

---

## 1. ¿Para qué sirve?

Es una **implementación web de *Arkham Horror: El Juego de Cartas* (LCG)** de Fantasy Flight Games, con la mayor cantidad posible de reglas automatizadas por el motor. Es un proyecto de fans, no oficial.

Funcionalidades principales:

- Partidas multijugador de hasta 4 jugadores, y "multiplayer solitaire" (una persona maneja varios investigadores).
- **Todo el contenido del Capítulo 1** (todas las cartas de jugador, promos, paralelos, todas las campañas y escenarios, incluidos los escenarios desafío).
- Capítulo 2: *Brethren of Ash*, *Children of Blood* (beta) y *Traces to Nowhere* (beta).
- Contenido **homebrew** (campañas e historias paralelas hechas por fans; requiere activar el programa beta en Ajustes).
- Importación de mazos desde **ArkhamDB** y **arkham.build**.
- Lecturas de tarot, registro de campaña, logros, etc.
- Un segundo juego en el mismo repositorio: **Arkham Horror 3.ª edición (el juego de tablero)**, con su propio motor y su propio frontend (`3ed.arkhamhorror.app`).
- Interfaz multilingüe: inglés, francés, italiano, coreano, vietnamita, **español**, chino tradicional, chino simplificado y alemán.

---

## 2. Tecnologías

| Capa | Tecnología |
|---|---|
| **Backend / motor de reglas** | **Haskell** (GHC 9.14.1, Stack 3.7+), framework web **Yesod**, ~10 000 archivos `.hs` (~4 200 son cartas) |
| **Base de datos** | **PostgreSQL** (migraciones SQL en `migrations/deploy`, esquema generado en `setup.sql`) |
| **Tiempo real** | WebSockets (salas de juego) |
| **Frontend principal** | **Vue 3** + **TypeScript** + **Vite 7**, Pinia (estado), vue-router, **vue-i18n** (traducciones), GSAP/Lottie (animaciones), Sass |
| **Frontend 3.ª edición** | Vue 3 + Vite (`frontend-3ed/`) |
| **Imágenes** | ~2,9 GB en S3/CloudFront (`assets.arkhamhorror.app`), **no** están en git |
| **Datos de cartas** | JSON exportados de **ArkhamDB** (`frontend/public/cards_<idioma>.json`) |
| **Infraestructura** | Docker / docker-compose, nginx, Terraform, Nix (`flake.nix`), GitHub Actions (CI Haskell, hadolint, build offline) |
| **Extras** | Servidor **MCP** en Python (`mcp/arkham-cards`) para ayudar a escribir cartas personalizadas |

---

## 3. Componentes principales

```
ArkhamHorror/
├── backend/
│   ├── arkham-api/            ← API + motor del LCG (Haskell)
│   │   ├── library/Arkham/    ← el motor: cartas, reglas, campañas, escenarios
│   │   │   ├── Asset/Assets/  ← un archivo .hs por carta de apoyo (p. ej. Machete.hs)
│   │   │   ├── Event/, Skill/, Enemy/, Location/, Treachery/, Act/, Agenda/ ...
│   │   │   ├── Campaigns/     ← lógica de cada campaña (NightOfTheZealot, TheDunwichLegacy, ...)
│   │   │   ├── Scenarios/     ← lógica de cada escenario
│   │   │   └── Homebrew/      ← campañas de fans (aisladas del juego base)
│   │   ├── library/Api/       ← endpoints HTTP / websockets
│   │   └── tests/             ← test suite (hspec)
│   └── ah3e/                  ← motor del juego de tablero (3.ª edición)
├── frontend/                  ← cliente web del LCG (Vue 3)
│   ├── src/arkham/            ← componentes del tablero, cartas, helpers de imágenes
│   ├── src/locales/<idioma>/  ← TEXTOS DE LA INTERFAZ y de campañas (i18n)
│   ├── src/digests/<idioma>.json ← lista de imágenes traducidas disponibles en el CDN
│   ├── public/cards_<idioma>.json ← datos/textos de cartas por idioma (de ArkhamDB)
│   ├── translation-overrides/ ← correcciones manuales a las traducciones de cartas
│   ├── homebrew/<campaña>/    ← config, textos y arte de campañas homebrew
│   ├── scripts/               ← importación de datos de cartas, digests, etc.
│   └── tests/                 ← tests de Node (incluye tests de locales)
├── frontend-3ed/              ← cliente del juego de tablero
├── migrations/                ← migraciones SQL
├── docs/                      ← documentación (homebrew, Windows, instalación, 3ed...)
├── mcp/                       ← servidor MCP para crear cartas custom
├── offline/                   ← empaquetado "prebuilt" autocontenido
└── scripts/                   ← setup, boot, fetch de imágenes...
```

**Cómo encaja todo:** el backend en Haskell contiene el estado completo de la partida y aplica las reglas mediante un sistema de mensajes (`RunMessage`), habilidades (`HasAbilities`) y modificadores (`HasModifiersFor`). El frontend recibe el estado por websocket y lo dibuja; muestra los textos de la interfaz con vue-i18n y las imágenes/textos de cartas según el idioma elegido, cayendo a inglés cuando falta una traducción (`fallbackLocale: 'en'`).

---

## 4. Cómo levantar el proyecto en local

- **Solo para jugar:** usar el [paquete prebuilt](docs/install/prebuilt.md) o [Docker en Windows](docs/install/docker-windows.md).
- **Para desarrollar en Windows:** todo debe hacerse **dentro de WSL** ([docs/windows.md](docs/windows.md)). El clon debe estar en el filesystem de WSL (`~/ArkhamHorror`), **no** en `/mnt/c/...` (es muy lento y Postgres no acepta ese directorio). ⚠️ El clon actual en `C:\Proyectos\...` sirve para editar textos y JSON, pero no para compilar el backend.

```bash
./scripts/setup          # verifica/instala dependencias, crea la BD, compila el backend
./scripts/boot           # API :3002, frontend :8080, frontend 3ed :8081
./scripts/fetch-assets.sh en+es   # imágenes en inglés + español (opcional)
```

**Atajo si solo vas a tocar traducciones:** basta con el frontend (`cd frontend && npm install && npm run dev`). Las imágenes se cargan del CDN, y para ver una partida hace falta tener la API corriendo (local o Docker).

Tests:

```bash
cd frontend && npm run tc && npm test       # typecheck + tests (incluye validación de locales)
cd backend && make test                     # tests del motor
```

---

## 5. Cómo aportar (siendo un repositorio de terceros)

No hay un `CONTRIBUTING.md`, así que el flujo es el estándar de GitHub:

1. **Fork** de `halogenandtoast/ArkhamHorror` en tu cuenta.
2. Configurar remotos en tu clon:
   ```bash
   git remote rename origin upstream
   git remote add origin https://github.com/<tu-usuario>/ArkhamHorror.git
   ```
3. Crear una **rama por tema** (`git checkout -b es/the-forgotten-age`); no trabajar sobre `main`.
4. Mantener la rama al día: `git fetch upstream && git rebase upstream/main`.
5. Hacer commits pequeños, con mensajes en inglés y en el estilo del repo (imperativo y descriptivo, p. ej. *"Add Spanish translation for The Path to Carcosa"*).
6. Correr `npm run tc` y `npm test` (frontend) o `make test` (backend) antes de subir.
7. Abrir un **Pull Request** contra `main` del upstream, en inglés, explicando qué cambia. Las traducciones suelen ir en un PR por campaña.

**Otras formas de aportar:**

- **Reportar bugs** con la plantilla de *Issues*: siempre incluir el **Game ID** (el identificador que aparece en la URL de la partida) y no borrar la partida.
- **Corregir reglas o cartas** en el backend (Haskell). Es la parte más difícil, pero también la más valiosa.
- **Contenido homebrew** siguiendo [docs/homebrew.md](docs/homebrew.md): todo va en una carpeta aislada (`Arkham/Homebrew/<Campaña>/` y `frontend/homebrew/<campaña>/`), sin tocar archivos del juego base.
- **Traducciones**: es el área de mayor impacto para el español y la que tiene la barrera de entrada más baja (solo JSON, sin compilar Haskell).

**Precedente útil:** las traducciones al español de *La noche de la fanática*, *El legado de Dunwich* y *El camino a Carcosa* entraron vía PR de la comunidad (por ejemplo el commit `97f0f682d6`, PR #5732). Es un buen modelo a copiar.

---

## 6. Contenido en español: estado actual

En el juego hay **tres tipos de contenido** traducible y cada uno se maneja distinto:

| Tipo | Dónde vive | Estado en español |
|---|---|---|
| **A. Textos de interfaz y campañas** (botones, registro, preparación de escenarios, resoluciones, fichas del caos) | `frontend/src/locales/es/` | **Muy incompleto**: 10 entradas frente a 37 en inglés. `base.json` tiene ~140 líneas frente a ~2 300 en `en`; `label.json` ~110 frente a ~600 |
| **B. Datos/texto de cartas** (nombre, texto, rasgos, ambientación) | `frontend/public/cards_es.json` | **Bastante completo**: viene de ArkhamDB en español (≈5 000 de 5 929 cartas tienen un nombre distinto del inglés) |
| **C. Imágenes de cartas en español** | CDN `img/arkham/es/...` + `src/digests/es.json` | ~7 000 imágenes disponibles (vs ~7 700 en francés) |

### Qué falta en `src/locales/es/` (comparado con `en/` y `fr/`)

- Archivos generales: `cards.json`, `investigators.json`, `log.json`, `campaignLog.json`, `xp.json`, `cardOption.json`, `event.json`, `narratives/`.
- Campañas: *The Forgotten Age*, *The Circle Undone*, *The Dream-Eaters*, *The Innsmouth Conspiracy*, *Edge of the Earth*, *The Scarlet Keys*, *The Feast of Hemlock Vale* (hoy `es.ts` importa la versión **inglesa**), *The Drowned City*, *Brethren of Ash*, *Children of Blood* y `standalone/` (escenarios sueltos).
- `base.json` y `label.json` están muy recortados (hay un `base_old.json` que parece un resto viejo).
- `gameBoard/` existe, pero conviene compararlo clave por clave con `en/gameBoard/`.

Todo lo que falta se muestra en **inglés**, porque vue-i18n cae al idioma de respaldo.

---

## 7. Cómo agregar textos en español (interfaz y campañas)

### Estructura

`frontend/src/locales/es.ts` es el punto de entrada y junta todos los JSON:

```ts
import base from '@/locales/es/base.json'
import label from '@/locales/es/label.json'
import gameBoard from '@/locales/es/gameBoard/gameBoard'
import nightOfTheZealot from '@/locales/es/nightOfTheZealot'
...
export default {...base, ...label, ...gameBoard, nightOfTheZealot, theDunwichLegacy, thePathToCarcosa, theFeastOfHemlockVale}
```

Cada campaña tiene un `.ts` índice y una carpeta con `base.json` y `scenarios/<escenario>.json`.

### Pasos para traducir una campaña nueva (ej.: *The Forgotten Age*)

1. Copiar la estructura del inglés:
   ```bash
   cp -r frontend/src/locales/en/theForgottenAge   frontend/src/locales/es/
   cp    frontend/src/locales/en/theForgottenAge.ts frontend/src/locales/es/
   ```
2. En `es/theForgottenAge.ts`, cambiar los imports de `@/locales/en/...` a `@/locales/es/...`.
3. Traducir **solo los valores** de los JSON. **Nunca cambiar las claves.** Respetar:
   - Placeholders como `{setImgPath}`, `{count}` y los iconos `{skull}`, `{cultist}`, `{tablet}`, `{elderThing}`...
   - El HTML embebido (`<section>`, `<ul>/<li>`, `<img>`), que debe quedar balanceado.
   - El marcado de rasgos `_Gul_` y de títulos `*La reunión*`.
4. Registrar la campaña en `frontend/src/locales/es.ts` (import + agregarla al objeto exportado). Si en `fr.ts` hay alias, como `returnToTheForgottenAge: theForgottenAge`, replicarlos.
5. Validar:
   ```bash
   cd frontend
   npm run tc
   npm test                       # localeMarkup, localeIconPlaceholders, localeKeyReferences...
   npm run check:locale-markup    # reporte de <ul>/<li> desbalanceados
   ```
6. Probar en la app: Ajustes → idioma Español, y jugar o abrir el escenario.

Para `base.json`, `label.json`, etc. el procedimiento es el mismo: tomar el `en/...json`, traducir los valores que falten y conservar las claves. Como hay fallback a inglés, se puede traducir de a poco sin romper nada.

**Consejo de terminología:** usar la traducción oficial de Edge Entertainment / FFG en español (nombres de cartas, escenarios, rasgos). `cards_es.json` sirve de glosario para que los nombres coincidan con las cartas impresas.

---

## 8. Cómo agregar o corregir cartas en español

### Texto de cartas (`cards_es.json`)

El texto **no se escribe a mano en el repo**. Se descarga desde ArkhamDB:

```bash
cd frontend
node scripts/fetch-card-data.cjs --langs es --slim   # descarga desde es.arkhamdb.com
```

- **Si una carta está mal o falta en español**, lo ideal es corregirla **upstream** en [`Kamalisk/arkhamdb-json-data`](https://github.com/Kamalisk/arkhamdb-json-data) (carpeta `translations/es/`) y luego reimportar. Así lo aprovechan ArkhamDB y todas las apps.
- **Corrección rápida en este repo:** existe un sistema de *overrides* (`frontend/translation-overrides/`, hoy para `fr`, `ko`, `zh-cn`). Se podría crear `translation-overrides/es.json`:
  ```json
  [
    { "code": "01016", "name": "Cuchillo", "text": "..." }
  ]
  ```
  y regenerar con
  ```bash
  node scripts/import-card-translations.cjs --source-locale es --output-lang es --slim
  ```
  (opcionalmente agregando un script `import-es-cards` a `package.json`, como los de `fr` y `zh-cn`). Este importador espera un clon de `arkhamdb-json-data` junto al repo. Solo se aceptan los campos `name`, `subname`, `text`, `traits`, `flavor`, `slot`, `back_*` y `customization_*`. Hay que documentar la entrada en `translation-overrides/README.md`, porque los overrides se consideran **temporales** hasta que se arregle upstream.

### Imágenes de cartas en español

- Se sirven desde el CDN bajo `img/arkham/es/<ruta>` y la app solo las usa si figuran en `frontend/src/digests/es.json` (la lógica está en `frontend/src/arkham/helpers.ts`, función `imgsrc`).
- Subir imágenes al S3 (`make sync-and-manifest`) requiere credenciales del mantenedor. Para aportar imágenes que faltan, lo práctico es **abrir un issue o PR ofreciéndolas** y coordinarlo con él.
- Para verlas en local: `./scripts/fetch-assets.sh en+es`.

### Cartas nuevas (reglas)

Una carta "nueva" a nivel de juego implica implementarla en **Haskell**: un archivo en `backend/arkham-api/library/Arkham/<Tipo>/<Tipo>s/<Nombre>.hs` más su definición en el `Cards` correspondiente. El texto e idioma de la carta no se programan en Haskell: salen de los JSON de ArkhamDB descritos arriba.

### Contenido homebrew en español

Las campañas homebrew tienen sus propios textos en `frontend/homebrew/<campaña>/locales/<idioma>/` (por ejemplo `dark-matter/locales/` tiene `en`, `ko` y `zh-cn`). Para traducir una al español hay que crear `locales/es/` copiando la estructura de `en/`.

---

## 9. Plan sugerido para empezar

1. Hacer fork, clonar dentro de WSL y levantar el frontend.
2. **Primer PR chico:** completar `frontend/src/locales/es/label.json` y `base.json` contra `en/` (alto impacto visual: botones y menús de toda la app).
3. Segundo PR: `investigators.json`, `log.json` y `campaignLog.json`.
4. Después, un PR por campaña, en orden: *The Forgotten Age* → *The Circle Undone* → *The Dream-Eaters* → ... → *The Feast of Hemlock Vale* (reemplazando el import inglés en `es.ts`).
5. Ir anotando errores de texto de cartas y reportarlos en `arkhamdb-json-data`, o proponer `translation-overrides/es.json`.
6. Antes de una tarea grande, abrir un *issue* avisando que vas a traducir X, para no duplicar trabajo con otros contribuidores.
