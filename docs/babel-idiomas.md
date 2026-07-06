# Horarios del Centro de Enseñanza de Idiomas (CEI) — investigación Babel

_Última investigación: 2026-07-06_

## Resumen

Los usuarios han pedido mucho agregar los horarios de **idiomas** de la FES Acatlán.
Estos **no** viven en el sistema de licenciatura (`escolares.acatlan.unam.mx/HISTORIA/...`)
que ya scrapeamos, sino en un sistema aparte del CEI llamado **Babel**.

**Conclusión: es técnicamente factible, pero hoy no hay datos que scrapear** porque la
oferta de idiomas del periodo 2027-1 aún no se publica (la convocatoria de idiomas sale
después que la de licenciatura).

## Dónde viven los datos

- Portal CEI: https://www.acatlan.unam.mx/idiomas/ (páginas informativas, sin horarios por grupo)
- Sistema de inscripción **Babel**: https://sistemas.acatlan.unam.mx/babel/
- **Endpoint público (sin login)**: `https://sistemas.acatlan.unam.mx/babel/GruposAbiertos.aspx`
  - Menú lo etiqueta como **"Horarios L-V"**.
  - Título de la página: _"Horarios Disponibles de Cursos de Lunes a Viernes del Periodo 2027-1"_.
  - Confirma que **sí** exponen grupos con día/horario públicamente, y que el periodo es 2027-1.
  - Probablemente hay un equivalente para cursos **sabatinos** (el CEI ofrece regulares L-V y sabatinos).

## Estado actual (2026-07-06) — bloqueante

`GruposAbiertos.aspx` responde HTTP 200 pero **sin tabla**: dispara un `radalert` de Telerik con el mensaje:

> "Por el momento no hay idiomas calendarizados. Espera a que se publique la convocatoria
> para revisar los idiomas disponibles."

Es decir, la oferta de idiomas 2027-1 todavía no está cargada. **No se puede desarrollar ni
validar el parser hasta que publiquen la convocatoria** (sin datos reales no hay contra qué probar).

## Diferencias técnicas vs. el scraper de licenciatura

| Aspecto        | Licenciatura (actual)                    | Babel / Idiomas                                  |
|----------------|------------------------------------------|--------------------------------------------------|
| Tecnología     | ASP clásico, GET/POST simples            | **ASP.NET WebForms + Telerik RadControls**       |
| Estado en HTML | tabla directa tras POST                  | `__VIEWSTATE`, `__EVENTVALIDATION`, `__doPostBack`, RadScriptManager |
| Selección      | POST con campo `Carreras`                | Postback por idioma (control aparece cuando hay oferta) |
| Campos         | grupo, día, hora, salón, profesor        | mismos (grupo, horario, día; falta confirmar salón/profesor con datos reales) |
| Estado hoy     | 2027-1 cargado ✅                         | vacío hasta convocatoria ⏳                        |

Notas de implementación cuando haya datos:
- Hay que mantener y reenviar `__VIEWSTATE` / `__EVENTVALIDATION` entre el GET inicial y los postbacks.
- El idioma probablemente se selecciona por `__doPostBack` (no un `<select>` clásico), lo que obliga a
  simular el evento (`__EVENTTARGET` / `__EVENTARGUMENT`) en el POST.
- Confirmar contra HTML real: nombres exactos de columnas, si trae salón y profesor, y si niveles/idiomas
  requieren un postback por cada uno.

## Plan sugerido

1. **Esperar** a que se publique la convocatoria/oferta de idiomas 2027-1 en Babel.
2. Cuando `GruposAbiertos.aspx` ya muestre tabla, capturar el HTML real y diseñar
   `backend/scraper/scraper-idiomas.js` (manejo de viewstate + postback por idioma).
3. Salida análoga a licenciatura: `data/idiomas/*.json` + índice/metadata, con tests de integridad.
4. Exponer en la API (`/api/idiomas`) y en el frontend como una sección/pestaña separada.

## Endpoints observados en Babel (para referencia)

- `frmLogin.aspx` — login
- `AcuerdoRegistroDatos.aspx` — registro inicial
- `GruposAbiertos.aspx` — **horarios públicos L-V** (el que nos interesa)
- `Convocatorias.aspx` — convocatorias
- `ConsultaDatos.aspx` — consulta por número de cuenta
- `Contacto.aspx` — contacto
