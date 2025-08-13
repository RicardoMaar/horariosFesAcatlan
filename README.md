# 📚 Horarios FES Acatlán

Sistema integral para consultar y gestionar horarios académicos de la Facultad de Estudios Superiores Acatlán (UNAM). Permite a los estudiantes crear horarios personalizados, visualizar conflictos de horarios y exportar sus calendarios.

## 🚀 Características

- **Visualización interactiva**: Calendario semanal con vista responsiva para desktop y móvil
- **Gestión de materias**: Selección múltiple con detección automática de traslapes
- **Exportación**: PDF, Excel y capturas de pantalla del horario
- **Persistencia**: Los horarios se guardan automáticamente en el navegador
- **Búsqueda inteligente**: Filtrado por nombre de materia, profesor o código
- **Colores personalizables**: Sistema de colores determinístico para cada materia
- **Optimización**: Caché inteligente y rate limiting para mejor rendimiento

## 🏗️ Arquitectura

### Frontend (React + Vite)
- **Framework**: React 19 con Vite para desarrollo rápido
- **Estado**: Zustand para gestión de estado global con persistencia
- **UI**: Tailwind CSS + Radix UI para componentes accesibles
- **Animaciones**: Framer Motion para transiciones fluidas
- **Exportación**: html2canvas, jsPDF y xlsx para múltiples formatos

### Backend (FastAPI)
- **API REST**: FastAPI con documentación automática OpenAPI
- **Caché**: Sistema de caché en memoria con validación ETags
- **Optimización**: Rate limiting (100 req/min) y compresión GZip
- **CORS**: Configurado para producción y desarrollo local
- **Salud**: Endpoints de health check y status

### Scraper (Node.js)
- **Automatización**: Extrae datos del sistema académico oficial
- **Procesamiento**: JSDOM para parsing HTML y estructuración de datos
- **Almacenamiento**: Guarda datos en JSON y opcionalmente en Supabase
- **Scheduling**: Nodemon para desarrollo con auto-reload

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- Python 3.8+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/horariosFesAcatlan.git
cd horariosFesAcatlan
```

### 2. Configurar Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configurar Frontend
```bash
cd frontend
npm install
```

### 4. Configurar Scraper
```bash
cd backend/scraper
npm install
```

## 🔧 Configuración

### Variables de entorno

#### Backend
Crear archivo `.env` en `/backend/`:
```env
HORARIOS_JSON_URL=https://tu-url-de-datos.com/horarios.json
PORT=8000
```

#### Scraper (opcional)
Crear archivo `.env` en `/backend/scraper/`:
```env
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_key
```

## 🚀 Uso

### Desarrollo

1. **Ejecutar Backend**:
```bash
cd backend
source venv/bin/activate
python main.py
```

2. **Ejecutar Frontend**:
```bash
cd frontend
npm run dev
```

3. **Ejecutar Scraper** (opcional):
```bash
cd backend/scraper
npm run dev
```

### Producción

1. **Build Frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy Backend**:
```bash
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📚 API Endpoints

### Base URL: `/api`

- `GET /status` - Estado del servicio y fecha de actualización
- `GET /carreras` - Lista de todas las carreras disponibles
- `GET /horarios/{carrera_codigo}` - Horarios de una carrera específica
- `GET /health` - Health check del servicio

### Ejemplo de respuesta:
```json
{
  "carreras": {
    "20121": {
      "codigo": "20121",
      "nombre": "Arquitectura"
    }
  }
}
```

## 🛠️ Scripts Disponibles

### Frontend
- `npm run dev` - Servidor de desarrollo (puerto 3000)
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Análisis de código con ESLint

### Backend
- `python main.py` - Ejecutar servidor FastAPI
- `uvicorn main:app --reload` - Servidor con auto-reload

### Scraper
- `npm run dev` - Ejecutar scraper con auto-reload
- `npm run lint` - Análisis de código

## 🗂️ Estructura del Proyecto

```
horariosFesAcatlan/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   ├── calendario/   # Componentes del calendario
│   │   │   └── listaMaterias/ # Componentes de lista
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Gestión de estado (Zustand)
│   │   ├── utils/           # Utilidades y helpers
│   │   └── constants/       # Constantes de la aplicación
│   ├── public/              # Archivos estáticos
│   └── package.json
├── backend/                 # API FastAPI
│   ├── main.py             # Punto de entrada de la API
│   ├── requirements.txt    # Dependencias Python
│   └── scraper/            # Scraper Node.js
│       ├── scraper.js      # Lógica principal del scraper
│       ├── upload.js       # Upload a Supabase
│       ├── materias/       # Datos extraídos
│       └── package.json
└── README.md
```

## 🎨 Características Técnicas

### Frontend
- **Responsive Design**: Optimizado para desktop y móvil
- **PWA Ready**: Configurado para Progressive Web App
- **IndexedDB**: Almacenamiento local para mejor rendimiento
- **Lazy Loading**: Carga optimizada de componentes
- **Error Boundaries**: Manejo robusto de errores

### Backend
- **Async/Await**: Operaciones asíncronas para mejor rendimiento
- **Middleware**: CORS, compresión GZip y rate limiting
- **Caché Inteligente**: ETags y Last-Modified headers
- **Documentación**: OpenAPI/Swagger automática en `/docs`

### Scraper
- **DOM Parsing**: Extracción robusta de datos HTML
- **Error Handling**: Manejo de fallos de red y parsing
- **Data Validation**: Validación de estructura de datos
- **Flexible Output**: JSON local y cloud storage

## 🔒 Seguridad

- Rate limiting para prevenir abuso de la API
- Validación de entrada en todos los endpoints
- CORS configurado específicamente para dominios autorizados
- Sanitización de datos del scraper

## 📈 Rendimiento

- Caché en memoria con invalidación inteligente
- Compresión GZip para reducir transferencia de datos
- Persistencia local para reducir llamadas a la API
- Lazy loading de componentes React
- Bundle optimization con Vite

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Guidelines de desarrollo
- Usar ESLint para mantener consistencia de código
- Escribir tests para nuevas funcionalidades
- Documentar cambios en la API
- Seguir convenciones de commit semántico

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Ricardo Martinez** - *Desarrollo inicial* - [@ricardomartinez](https://github.com/ricardomartinez)

## 🙏 Agradecimientos

- UNAM FES Acatlán por los datos académicos
- Comunidad de React y FastAPI
- Contribuidores del proyecto

## 🐛 Reportar Issues

Si encuentras algún problema o tienes sugerencias:
1. Revisa los [issues existentes](https://github.com/tu-usuario/horariosFesAcatlan/issues)
2. Crea un nuevo issue con etiquetas apropiadas
3. Incluye pasos para reproducir el problema

## 📊 Estado del Proyecto

- ✅ Frontend completo y funcional
- ✅ Backend API REST con caché
- ✅ Scraper automatizado
- ✅ Exportación múltiple formato
- 🔄 PWA en desarrollo
- 🔄 Tests unitarios en desarrollo
- 🔄 CI/CD pipeline en desarrollo

---

⭐ Si este proyecto te ha sido útil, no olvides darle una estrella en GitHub!