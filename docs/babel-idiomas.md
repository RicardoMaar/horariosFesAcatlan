# Horarios del Centro de Enseñanza de Idiomas (CEI) — investigación Babel

_Última investigación: 2026-07-28_

## Resumen

Los usuarios han pedido mucho agregar los horarios de **idiomas** de la FES Acatlán.
Estos **no** viven en el sistema de licenciatura (`escolares.acatlan.unam.mx/HISTORIA/...`)
que ya scrapeamos, sino en un sistema aparte del CEI llamado **Babel**.

**La oferta ya está publicada y ya se puede scrapear.** Babel muestra el periodo 2027-1,
siete idiomas y una tabla pública de grupos con días, horas y profesor cuando está asignado.
La corrida más reciente generó 172 grupos; la oferta cambió durante la investigación, así
que el scraper descubre el catálogo en cada ejecución en lugar de fijarlo en código.

## Dónde viven los datos

- Portal CEI: https://www.acatlan.unam.mx/idiomas/ (páginas informativas, sin horarios por grupo)
- Sistema de inscripción **Babel**: https://sistemas.acatlan.unam.mx/babel/
- **Endpoint público (sin login)**: `https://sistemas.acatlan.unam.mx/babel/GruposAbiertos.aspx`
  - Menú lo etiqueta como **"Horarios L-V"**.
  - Título de la página: _"Horarios Disponibles de Cursos de Lunes a Viernes del Periodo 2027-1"_.
  - Confirma que **sí** exponen grupos con día/horario públicamente, y que el periodo es 2027-1.
  - Idiomas publicados en la última corrida: Alemán, Griego Clásico, Inglés, Italiano, Latín,
    Portugués y Ruso.
  - Este endpoint corresponde a cursos **L-V**. Los sabatinos siguen siendo una extensión pendiente.

## Estado actual (2026-07-28) — scraper funcional

`GruposAbiertos.aspx` ya entrega las opciones y sus postbacks. El scraper implementado en
`backend/scraper/scraper-idiomas.js` conserva cookies, `__VIEWSTATE`, `__EVENTVALIDATION` y
los `ClientState` de Telerik para recorrer:

`idioma → tipo de curso → nivel → modalidad → tabla de grupos`.

La salida vive en `data/idiomas/`:

- `index.json`: periodo, catálogo de idiomas y conteo de grupos.
- `<idioma>.json`: grupos normalizados con profesor, días, horas y filtros de origen.
- `metadata.json` / `changes.json`: hashes y cambios entre corridas.

Los grupos sin profesor asignado se conservan con `profesor: ""`; no se rellenan ni se
infieren datos que Babel no publica.

## Diferencias técnicas vs. el scraper de licenciatura

| Aspecto        | Licenciatura (actual)                    | Babel / Idiomas                                  |
|----------------|------------------------------------------|--------------------------------------------------|
| Tecnología     | ASP clásico, GET/POST simples            | **ASP.NET WebForms + Telerik RadControls**       |
| Estado en HTML | tabla directa tras POST                  | `__VIEWSTATE`, `__EVENTVALIDATION`, `__doPostBack`, RadScriptManager |
| Selección      | POST con campo `Carreras`                | Postback por idioma (control aparece cuando hay oferta) |
| Campos         | grupo, día, hora, salón, profesor        | mismos (grupo, horario, día; falta confirmar salón/profesor con datos reales) |
| Estado hoy     | 2027-1 cargado ✅                         | 2027-1 cargado ✅                                  |

Notas de implementación cuando haya datos:
- Hay que mantener y reenviar `__VIEWSTATE` / `__EVENTVALIDATION` entre el GET inicial y los postbacks.
- El idioma probablemente se selecciona por `__doPostBack` (no un `<select>` clásico), lo que obliga a
  simular el evento (`__EVENTTARGET` / `__EVENTARGUMENT`) en el POST.
- Confirmar contra HTML real: nombres exactos de columnas, si trae salón y profesor, y si niveles/idiomas
  requieren un postback por cada uno.

## Siguiente trabajo

1. Ejecutar `node scraper-idiomas.js` desde `backend/scraper` cuando Babel publique cambios.
2. Exponer el catálogo y cada idioma mediante `/api/idiomas` y `/api/idiomas/:slug`.
3. Integrar la selección de idiomas en el calendario compartido con las carreras.
4. Investigar un endpoint equivalente para cursos sabatinos.

## Modelo para combinar carreras e idiomas

Un idioma no debe convertirse en una carrera artificial. Tanto una carrera como un idioma
son **fuentes de grupos** que alimentan el mismo calendario. La futura interfaz puede
mantener una selección normalizada por hoja:

```js
fuentes: [
  { tipo: 'carrera', id: '20121', nombre: 'Arquitectura' },
  { tipo: 'carrera', id: '20721', nombre: 'Derecho' },
  { tipo: 'idioma', id: 'aleman', nombre: 'Alemán' }
]
gruposSeleccionados: [
  { fuenteTipo: 'idioma', fuenteId: 'aleman', grupo: 'CL01_13AP01', horarios: [] }
]
```

El identificador visible debe llevar siempre el tipo y la fuente (`idioma:aleman:...`,
`carrera:20121:...`) para evitar colisiones. La interfaz puede permitir hasta dos carreras
y hasta tres idiomas por hoja, mostrando contadores separados; esos límites son de UX y no
deben duplicarse en el scraper ni en la API. El calendario y el detector de traslapes ya
trabajan con la forma común `horarios[]`, por lo que no requieren un renderer distinto.

## Endpoints observados en Babel (para referencia)

- `frmLogin.aspx` — login
- `AcuerdoRegistroDatos.aspx` — registro inicial
- `GruposAbiertos.aspx` — **horarios públicos L-V** (el que nos interesa)
- `Convocatorias.aspx` — convocatorias
- `ConsultaDatos.aspx` — consulta por número de cuenta
- `Contacto.aspx` — contacto
