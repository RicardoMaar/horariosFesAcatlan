# 📚 Horarios FES Acatlán

Sistema integral para consultar y gestionar horarios académicos de la Facultad de Estudios Superiores Acatlán (UNAM). Permite a los estudiantes crear horarios personalizados, visualizar conflictos de horarios y exportar sus calendarios.

## 🚀 Características

- **Visualización interactiva**: Calendario semanal con vista responsiva para desktop y móvil
- **Gestión de materias**: Selección múltiple con detección automática de traslapes
- **Exportación**: PDF, Excel y capturas de pantalla del horario
- **Persistencia**: Los horarios se guardan automáticamente en el navegador
- **Búsqueda inteligente**: Filtrado por nombre de materia, profesor o código
- **Colores personalizables**: Sistema de colores determinístico para cada materia
- **Actualización automatizada**: Scraper + GitHub Actions para regenerar datos

## 🏗️ Arquitectura

### Frontend (React + Vite)
- **Framework**: React 19 con Vite para desarrollo rápido
- **Estado**: Zustand para gestión de estado global con persistencia
- **UI**: Tailwind CSS + Radix UI para componentes accesibles
- **Animaciones**: Framer Motion para transiciones fluidas
- **Exportación**: html2canvas, jsPDF y xlsx para múltiples formatos

### API (Vercel Functions)
- **Endpoints**: `/api/status`, `/api/carreras`, `/api/horarios/{codigo}`
- **Caching**: ETag + Last-Modified para respuestas por carrera
- **Datos**: Lee JSONs por carrera desde `data/`

### Scraper (Node.js)
- **Automatización**: Extrae datos del sistema académico oficial
- **Procesamiento**: JSDOM para parsing HTML y estructuración de datos
- **Salida**: `data/carreras/*.json`, `data/index.json`, `data/metadata.json`, `data/changes.json`
- **Detección de cambios**: Hash SHA-256 por carrera + `last_changed`

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- (Opcional) Vercel CLI para correr la API localmente

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/horariosFesAcatlan.git
cd horariosFesAcatlan
```

### 2. Configurar Frontend
```bash
cd frontend
npm install
```

### 3. Configurar Scraper
```bash
cd backend/scraper
npm install
```

## 🔧 Configuración

### Variables de entorno
- `VITE_API_URL` (opcional): URL base de la API en desarrollo. Por defecto usa `/api`.

## 🚀 Uso

### Desarrollo

1. **API local (Vercel)**:
```bash
npx vercel dev --listen 3001
```

2. **Frontend**:
```bash
cd frontend
npm run dev
```

3. **Scraper (manual)**:
```bash
cd backend/scraper
node scraper.js
```
Esto regenera los archivos en `data/`.

### Producción

- Deploy único en Vercel (frontend + API).
- El workflow `.github/workflows/scrape.yml` actualiza `data/` automáticamente.

## 📚 API Endpoints

### Base URL: `/api`

- `GET /status` - Estado del servicio y fecha de actualización
- `GET /carreras` - Lista de todas las carreras disponibles
- `GET /horarios/{carrera_codigo}` - Horarios de una carrera específica

### Ejemplo de respuesta:
```json
{
  "20121": {
    "codigo": "20121",
    "nombre": "Arquitectura"
  }
}
```

## 🧪 Tests

Ejecuta los tests de integridad de datos:
```bash
node --test
```

Validaciones incluidas:
- Los JSONs en `data/` existen y son consistentes
- Hashes por carrera correctos
- Días y horarios válidos
- Detecta carreras faltantes (`carreras_faltantes`)

## 🤖 CI/CD

- **Scraper**: `.github/workflows/scrape.yml` (schedule + push a main)
- **Tests**: `.github/workflows/ci.yml` (PRs y pushes)

## 🗂️ Estructura del Proyecto

```
horariosFesAcatlan/
├── api/                      # Vercel Functions
├── data/                     # JSONs generados por carrera
│   ├── carreras/
│   ├── index.json
│   ├── metadata.json
│   └── changes.json
├── frontend/                 # Aplicación React
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   └── scraper/              # Scraper Node.js
├── tests/                    # Tests de integridad de datos
└── README.md
```

## 📈 Rendimiento

- Cache por carrera con ETag y Last-Modified
- JSONs separados por carrera para respuestas más rápidas
- Persistencia local para reducir llamadas a la API

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Ricardo Martinez** - *Desarrollo inicial* - [@ricardomartinez](https://github.com/ricardomartinez)

## 🙏 Agradecimientos

- UNAM FES Acatlán por los datos académicos
- Comunidad de React y Vercel

---

⭐ Si este proyecto te ha sido útil, no olvides darle una estrella en GitHub!
