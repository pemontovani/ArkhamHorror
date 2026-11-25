# Cómo ejecutar el proyecto (desarrollo y producción)

Guía para este fork de [halogenandtoast/ArkhamHorror](https://github.com/halogenandtoast/ArkhamHorror).
Está escrita para trabajar en **Windows con Docker Desktop**. Los comandos están en PowerShell salvo que se indique otra cosa.

---

## 1. Piezas del sistema

```
 Navegador ──► nginx (:3000) ──► API Haskell (:3002) ──► PostgreSQL (:5432 dentro de Docker)
                 │                     ▲
                 └─ sirve el frontend  └─ guarda partidas, usuarios y mazos
                    ya compilado
```

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **Frontend** | Aplicación Vue 3 | `frontend/` |
| **API / motor de reglas** | Haskell (Yesod), puerto 3002 | `backend/arkham-api/` |
| **Base de datos** | PostgreSQL 14 | contenedor `db` |
| **nginx** | Sirve el frontend compilado y reenvía `/api` a la API | dentro de la imagen `web` |
| **migrate** | Contenedor de un solo uso que aplica las migraciones SQL | `migrate.sh` + `migrations/` |

La imagen `web` (nginx + API + frontend compilado) es la que se publica como `halogenandtoast/arkham-horror:latest`.

---

## 2. PostgreSQL y la contraseña

Es el punto que más confunde, así que va primero.

### Qué guarda la base de datos
Usuarios (cuentas), partidas con todo su historial de pasos, mazos, ajustes y logros. **Si la pierdes, pierdes todo eso.** Las cartas y las imágenes no están en la base de datos.

### Datos de conexión (modo Docker)

| Dato | Valor |
|---|---|
| Usuario | `arkham_pg_user` |
| Base de datos | `arkham-horror-backend` |
| Contraseña | la que escribas en `config/postgres_password.txt` |
| Puerto dentro de Docker | `5432` (host `db`) |
| Puerto en tu PC | `127.0.0.1:5433` (solo desde tu máquina; cámbialo con `DB_PORT` en un `.env`) |
| Datos en disco | volumen de Docker `pgdata` |

### Cómo llega la contraseña a cada pieza
1. Tú creas el archivo `config/postgres_password.txt` con **solo la contraseña**.
2. `docker-compose.yml` lo declara como *secret* de Docker y lo monta en `/run/secrets/postgres_password`.
3. El contenedor `db` lo usa para crear el usuario (`POSTGRES_PASSWORD_FILE`).
4. El contenedor `migrate` lo lee para aplicar migraciones.
5. El contenedor `web` lo lee en [web-entrypoint.sh](web-entrypoint.sh) y arma la variable `DATABASE_URL=postgres://arkham_pg_user:<contraseña>@db:5432/arkham-horror-backend`.

Crear el archivo:

```powershell
mkdir config -Force
Set-Content -NoNewline config/postgres_password.txt "una-clave-larga-y-aleatoria"
```

### Reglas importantes

- **La contraseña solo se aplica cuando el volumen `pgdata` se crea por primera vez.** Cambiar después el archivo **no** cambia la contraseña real de Postgres. Si ya existe el volumen y los dos no coinciden, la web falla con `password authentication failed` (es el error típico de "no puedo registrarme").
- **Evita los caracteres `@ : / # ? %`** en la contraseña. Va incrustada en una URL y esos caracteres la rompen. Usa letras, números y guiones.
- El archivo `config/postgres_password.txt` está en [.gitignore](.gitignore) (`**/postgres_password.txt`). **No lo subas a GitHub.**
- La base de datos se crea con el esquema de [setup.sql](setup.sql) solo la primera vez; las migraciones posteriores las aplica el servicio `migrate` en cada arranque.

### Cambiar la contraseña con datos existentes

Opción A, conservando los datos:
```powershell
docker compose exec db psql -U arkham_pg_user -d arkham-horror-backend -c "ALTER USER arkham_pg_user PASSWORD 'nueva-clave';"
# después pon la MISMA clave en config/postgres_password.txt y reinicia:
docker compose up -d --force-recreate web migrate
```

Opción B, empezar de cero (**borra todas las partidas y cuentas**):
```powershell
docker compose down -v      # -v elimina el volumen pgdata
# edita config/postgres_password.txt
docker compose up -d
```

### Copia de seguridad y restauración

```powershell
# Copia
docker compose exec -T db pg_dump -U arkham_pg_user arkham-horror-backend > backup.sql

# Restauración (sobre una base vacía)
Get-Content backup.sql | docker compose exec -T db psql -U arkham_pg_user -d arkham-horror-backend
```

Haz la copia antes de actualizar la imagen o de tocar las migraciones.

### Entrar a la base de datos a mano

```powershell
docker compose exec db psql -U arkham_pg_user -d arkham-horror-backend
```
Desde una herramienta externa (DBeaver, pgAdmin): host `127.0.0.1`, puerto `5433`, usuario y base indicados arriba.

---

## 3. Desarrollo

Hay dos formas. **La A es la recomendada** para tocar traducciones y frontend.

### A) Frontend en modo desarrollo + backend en Docker (sin compilar Haskell)

Usa la imagen `halogenandtoast/arkham-horror:latest` ya compilada. Ideal para traducciones, interfaz y todo lo que no cambie el motor de reglas.

**Requisitos:** Docker Desktop corriendo y Node 20.19 o superior.

1. Crear la contraseña (sección 2).
2. Instalar dependencias del frontend (una vez):
   ```powershell
   cd frontend
   npm ci
   cd ..
   ```
3. Levantar base de datos, migraciones y API publicando la API en el puerto 3002 (Vite la busca ahí):
   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.dev-api.yml up -d db migrate web
   ```
   Comprobar: http://127.0.0.1:3002/health
4. Arrancar el frontend:
   ```powershell
   cd frontend
   npm run dev
   ```
5. Abrir **http://localhost:8080**, registrarse y probar.

Parar:
```powershell
docker compose -f docker-compose.yml -f docker-compose.dev-api.yml down
```
(`Ctrl+C` detiene el frontend.)

Notas:
- El override [docker-compose.dev-api.yml](docker-compose.dev-api.yml) solo añade el puerto `127.0.0.1:3002:3002`.
- Las imágenes de cartas se cargan del CDN con marca de agua visible; la quita solo el build de producción.
- Si tu clon está más adelantado o atrasado que la imagen `latest`, pueden aparecer errores de API que no tienen que ver con tus cambios.
- Cambiar el idioma: **Ajustes → Idioma**.

### B) Todo local desde el código fuente (compila Haskell)

Solo hace falta si vas a **modificar el backend**. Es lento (la primera compilación tarda horas y consume mucha RAM).

- Todo debe hacerse **dentro de WSL** con el repositorio en el sistema de archivos de WSL (`~/ArkhamHorror`), **no** en `/mnt/c`. Postgres no acepta un directorio de datos en `/mnt/c`. Ver [docs/windows.md](docs/windows.md).
- Instalación y arranque:
  ```bash
  ./scripts/setup          # instala dependencias, crea la base de datos, aplica migraciones, compila el backend
  ./scripts/boot           # API :3002, frontend :8080 y frontend 3.ª edición :8081
  ```
- Aquí la base de datos es un **Postgres instalado en WSL**, sin Docker. `scripts/setup` crea la base `arkham-horror-backend`. La API usa por defecto `postgres://localhost:5432/arkham-horror-backend` (sin usuario ni contraseña, autenticación local). Si necesitas otra conexión, define `DATABASE_URL`. La guía del backend ([backend/arkham-api/README.md](backend/arkham-api/README.md)) usa `createuser arkham-horror-backend --password arkham-horror-backend --superuser`, una contraseña **solo válida para desarrollo local**.
- Tests: `cd backend && make test` y `cd frontend && npm run tc && npm test`.

---

## 4. Producción

### 4.1 Producción local u offline (en tu PC o red local)

**Con la imagen oficial** (la más simple):
```powershell
docker compose up -d
```
Abrir http://localhost:3000. Ver también [docs/install/docker-windows.md](docs/install/docker-windows.md).

**Con imágenes de cartas locales** (sin depender del CDN):
1. Descargar las imágenes una vez:
   ```powershell
   docker run --rm `
     -v "${PWD}/frontend/public/img:/workspace/frontend/public/img" `
     -v "${PWD}/frontend-3ed/public/img:/workspace/frontend-3ed/public/img" `
     -v "${PWD}/scripts/fetch-assets.sh:/workspace/scripts/fetch-assets.sh:ro" `
     --entrypoint /bin/bash amazon/aws-cli /workspace/scripts/fetch-assets.sh en+es
   ```
2. Levantar con el override:
   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.local-assets.yml up -d
   ```

[docker-compose.local-assets.yml](docker-compose.local-assets.yml) fija `ASSET_HOST=http://localhost:3000`. **Tiene que ser una URL absoluta**: el navegador solo quita la marca de agua de las cartas cuando la URL empieza por `http(s)://`. Con `ASSET_HOST` vacío las cartas se verían con marca. Si otros dispositivos de tu red van a conectarse, sustituye `localhost` por la IP de tu PC.

**Paquete autocontenido sin Docker:** ver [docs/install/prebuilt.md](docs/install/prebuilt.md) (en Windows usa WSL por debajo).

### 4.2 Usar tus cambios (traducciones, frontend) en la imagen

La imagen oficial no incluye tus cambios. Para usar los tuyos hay que **construir tu propia imagen**:

```powershell
docker compose build web
```

Esto compila **también el backend en Haskell**, lo que tarda mucho y necesita varios GB de RAM. Puntos a cuidar:

- En `docker-compose.yml` el servicio `web` usa `image: "halogenandtoast/arkham-horror:latest"`. Cámbialo por un nombre propio (por ejemplo `tuusuario/arkham-horror:local`); si no, un `docker compose pull` pisa tu imagen con la del proyecto original.
- Argumentos de construcción útiles ([Dockerfile](Dockerfile)): `ASSET_HOST` (de dónde salen las imágenes) y `AUTH_COOKIE_DOMAIN` (dominio de la cookie de sesión; vacío para uso local).

### 4.3 Producción pública (un servidor en internet)

Antes de exponer nada a internet, revisa esta lista:

1. **`JWT_SECRET`**: el valor por defecto está escrito en el código ([settings.yml](backend/arkham-api/config/settings.yml)) y es público. Define el tuyo, largo y aleatorio, en el servicio `web`:
   ```yaml
   environment:
     - JWT_SECRET=<cadena-larga-aleatoria>
   ```
   Cambiarlo cierra las sesiones abiertas.
2. **Contraseña de Postgres** fuerte y distinta de la de desarrollo (sección 2).
3. **HTTPS**: el contenedor sirve HTTP en el puerto 3000. Ponle delante un proxy inverso con certificado (Caddy, nginx o Traefik).
4. **Nombre de dominio**: en [prod.nginxconf](prod.nginxconf) el servidor principal usa `server_name .arkhamhorror.app`. Sirve en `localhost` por ser el servidor por defecto, pero con tu dominio conviene cambiarlo.
5. **Puertos**: no publiques el puerto de Postgres. En `docker-compose.yml` ya está limitado a `127.0.0.1`; déjalo así.
6. **Copias de seguridad** periódicas de la base de datos (sección 2).
7. **Imágenes de cartas**: ver 4.1. El `prod.nginxconf` conserva un respaldo hacia el CDN (`@cdn_assets`) solo para archivos JS/CSS que falten en tu imagen; para uso normal no se activa.
8. **Actualizaciones**: `./upgrade.sh` actualiza un Docker o un checkout ([docs/install/updating.md](docs/install/updating.md)). Antes, copia de seguridad.

---

## 5. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `password authentication failed` al registrarte | El archivo de contraseña no coincide con la que Postgres creó la primera vez | Sección 2: cambiar la contraseña, o `docker compose down -v` si no importa perder datos |
| `error during connect ... dockerDesktopLinuxEngine` | Docker Desktop no está corriendo | Abre Docker Desktop y espera a "Engine running" |
| `config/postgres_password.txt: no such file` | No creaste el archivo | Sección 2 |
| El frontend carga pero no puedes iniciar sesión (`npm run dev`) | La API no está en el puerto 3002 | Usa el override `docker-compose.dev-api.yml` y comprueba `http://127.0.0.1:3002/health` |
| Las cartas se ven con marca de agua | Dev, o `ASSET_HOST` vacío/relativo | Es lo esperado en dev; en producción usa una URL absoluta (4.1) |
| Cartas o imágenes rotas | Faltan imágenes locales o `ASSET_HOST` mal puesto | Descarga con `fetch-assets.sh` o vuelve a la URL del CDN |
| El build de Docker se queda sin memoria | Compilar Haskell necesita mucha RAM | Aumenta la memoria de Docker Desktop (Settings → Resources) y usa WSL 2 |
| Los tests de locales fallan con rutas `c:/...` | Vite en Windows nativo no resuelve esas rutas | Ejecútalos en WSL |

---

## 6. Referencia rápida

```powershell
# Estado y logs
docker compose ps
docker compose logs -f web
docker compose logs db

# Parar / arrancar sin perder datos
docker compose stop
docker compose start

# Parar y quitar contenedores (conserva los datos)
docker compose down

# Parar y BORRAR los datos de la base de datos
docker compose down -v

# Reiniciar solo la API
docker compose restart web
```

| Puerto | Qué es |
|---|---|
| 3000 | Aplicación completa (nginx) |
| 3001 | Frontend de la 3.ª edición (juego de tablero) |
| 3002 | API (solo con el override de desarrollo) |
| 5433 | PostgreSQL, solo en `127.0.0.1` |
| 8080 | Frontend en modo desarrollo (`npm run dev`) |
