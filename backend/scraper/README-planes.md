# Scraper de planes de estudio + detector de anomalías

Pipeline que compara las **horas/semana** que cargan los grupos de un horario contra
las **horas del plan de estudios**, para detectar errores de carga (p.ej. un grupo
marcado con 4h cuando la materia es de 6h).

- `planes.mjs` → genera `data/planes/<codigo>.json` (horas esperadas por clave).
- `detectar-anomalias.mjs` → genera `data/anomalias/<codigo>.json` (grupos sospechosos).

> **Este scraper NO va en CI.** Se corre a mano, local, 1–2 veces al año (cuando se
> abren inscripciones / cambian planes). Es lento (descarga muchos PDFs).

```bash
cd backend/scraper
node planes.mjs            # todas las carreras
node planes.mjs 20821      # una sola (por código)
node detectar-anomalias.mjs   # regenera todas las anomalías
```

## De dónde salen las horas (3 fuentes por carrera)

Cada carrera usa **una** de estas estrategias, según cómo publique sus datos:

| Fuente | Cómo | Carreras |
|---|---|---|
| **PDF directo** | La página del plan en `acatlan.unam.mx` lista las materias con su **clave dentro del PDF** (o prefijada en el nombre de archivo) → se parsea el PDF y listo. | Arquitectura, Diseño Gráfico, Comunicación, Ing. Civil, Enseñanza de Inglés. |
| **Endpoint departamental** | El sitio de la carrera expone un AJAX con `{clave, nombre, url→PDF}` por semestre. | Actuaría, MAC. |
| **DGAE + PDF** (`dgae` config) | El PDF de la carpeta **vieja** no trae la clave. DGAE-SIAE da el puente **clave↔nombre**; las **horas** salen del PDF de Acatlán cruzando por clave-en-archivo o por nombre. | Economía (simple) + las 8 `multigen`: Derecho, Pedagogía, Historia, Lengua, Filosofía, C. Políticas, RRII, Sociología. |

En `planes.mjs`, cada carrera es una entrada del array `CARRERAS`. La estrategia se
elige por qué campo tiene: `endpoint`, `dgae`, o ninguno (PDF directo).

## La regla de oro: cargar TODOS los planes vigentes (no solo el más nuevo)

Cada carrera tiene varios planes a lo largo del tiempo. Durante un periodo de
transición (varios años) **conviven dos planes**: los de nuevo ingreso arrancan con
el plan nuevo, y los alumnos avanzados terminan con el viejo. **Ambos aparecen en el
mismo horario.**

➡️ Hay que cargar **todos los planes con VIGENCIA ≠ "NO"** (nuevo + viejos aún en
reinscripción). En la config `dgae`, `pde` acepta un **array** de planes; se unen sus
tablas clave↔nombre. Las **horas siempre salen del PDF del plan vigente**, así que
incluir planes viejos nunca mete horas equivocadas (solo permite que una clave vieja
herede las horas de la misma materia en el PDF actual, si el nombre coincide).

Ejemplos:
- **Economía** (`crr=306`): `pde:[2136, 1145]` — solo el 2021 (2136) tiene claves en el
  horario actual; el 2005 (1145) ya no aporta pero se deja por si reaparece un rezagado.
- **Sociología** (`crr=311`): `pde:[2163, 4233, 4234, 4235, 4236, 1144]` — el 2022 son 5
  planes (un tronco 2163 + 4 orientaciones terminales) y el 2005 (1144) **aún tiene ~32
  claves en el horario**.

### Planes con el nuevo dividido en tronco + orientaciones (como Sociología)

Varias carreras publican su plan más nuevo como **varios `pde`**: un tronco ("primer
ingreso y reinscripción") + N orientaciones terminales ("reinscripción"). Hay que listar
TODOS esos `pde`. Detectadas 2026-07-06, ordenadas por recencia del plan nuevo. La
columna "Fuente" dice cómo se resuelven las horas hoy y la cobertura vs. el horario real:

| Carrera | Plan nuevo | # pde | Fuente | Cobertura horario |
|---|---|---|---|---|
| Arquitectura | 2027 | — | PDF directo | ver nota abajo (1er sem 2027 sin PDF aún) |
| Derecho | 2026 | 9 | **DGAE multigen** | 96% |
| Pedagogía | 2026 | 8 | **DGAE multigen** | 96% |
| RRII | 2020 | 7 | **DGAE multigen** | 83% |
| Historia | 2025 | 8 | **DGAE multigen** | 94% |
| Lengua y Lit. Hispánicas | 2025 | 4 | **DGAE multigen** | 100% |
| Filosofía | 2024 | 5 | **DGAE multigen** | 98% |
| Sociología | 2022 | 6 | **DGAE multigen** | 100% |
| Ciencias Políticas y AP | 2020 | 4 | **DGAE multigen** | 97% |
| Comunicación | 2013 | 6 | PDF directo | viejo, estable |

Cobertura = % de claves del horario real con horas de plan; validada con **0 discrepancias**
entre horas del plan y la moda de horas de los grupos (para claves con ≥3 grupos), en las
9 carreras DGAE. Lo que falta sin cubrir son materias del plan viejo con PDF de **link
muerto (404)** en el servidor de Acatlán, o cuyo nombre difiere demasiado, o que cambiaron
de horas entre planes (no se adivina) → caen al modo *outlier* del detector (usa la moda
de grupos, seguro).

Planes "simples" (nuevo = 1 solo `pde`): Diseño Gráfico (2009), Actuaría (2014),
Economía (2021, DGAE simple), Ing. Civil (2014), MAC (2014), Enseñanza de Inglés (2013).

**RRII (caso especial — SUAYED vs presencial):** en DGAE (plt=204, crr=310) conviven planes
**SUAYED** (a distancia) y **presenciales**. El horario de Acatlán es presencial, así que en
`pde` SOLO van los presenciales vigentes: 2020 (`2123`+`4186`/`4187`) y 2005 (`1128`-`1131`).
Además Acatlán solo publica UNA carpeta de PDF (la del 2020, `…2019`), así que las claves del
2005 sacan sus horas de esa misma carpeta por nombre (misma materia, mismas horas; validado
con 0 discrepancias). Cobertura 64%→**81%**; el residuo (10) son optativas del 2005 que el
2020 renombró/quitó y no tienen PDF.

**Arquitectura — plan 2027 sin PDF (equivalencias parciales):** sus claves sin cubrir (1er
semestre) son del plan **2027**, que apenas entró; Acatlán aún **no publica los PDFs del 2027**
y la única carpeta es la del 2012. Donde la materia 2027 **corresponde 1:1** a una del 2012 del
**mismo semestre** y sus horas == la mayoría (unánime) de los grupos 2027, se puentea vía
`EQUIVALENCIAS` (1108→1100, 1109→1105, 1111→1103, 1113→1106). Las que el 2027 **rediseñó** no se
puentean: 1112 "Matemáticas en Arquitectura" bajó a 4h (el 2012 tenía 6h → horas no coinciden,
se rechaza sola), y 1110/1114 no tienen correspondencia clara. Igual el detector las cubre por
*outlier* (9-18 grupos c/u). Se cubrirán del todo cuando Acatlán publique los PDFs del 2027.

### Modo `multigen`: matching por generación (para plan dividido)

Las 8 marcadas arriba tienen DOS generaciones vigentes con alumnos en el horario (el plan
nuevo y uno viejo de 2005-2013) y **cada una tiene su propia carpeta de PDF** en Acatlán
(la vieja sin año en el nombre; la nueva con año). (RRII es la excepción: solo hay carpeta
del plan nuevo, ver nota arriba.) El puente DGAE con `dgae.multigen: true`:

> **Sociología** era `simple` (una sola carpeta) pero tiene DOS (`Sociologia`=2005 y
> `Comunicacion-Social-22`=2022); en simple solo se usaba `carpetas.at(-1)` → se perdían
> las materias de la otra carpeta. Al pasarla a `multigen` cada generación cruza su carpeta
> y subió **90%→100%**. Lección: si una carrera DGAE tiene ≥2 carpetas de PDF, va en multigen.

1. **Agrupa los `pde` por generación** (año de "1a. GEN" de la lista `acc=pde`).
2. **Mapea cada generación a su carpeta** por rango (vieja→carpeta vieja, nueva→carpeta
   nueva; se alinean por la cola, la gen más nueva con la carpeta más nueva).
3. **Cruza cada clave contra la carpeta de SU generación** → una clave vieja saca horas
   del PDF viejo y una nueva del PDF nuevo; **nunca se cruzan**. Esto elimina de raíz el
   riesgo "misma clave con distintas horas entre planes" (verificado: 0 discrepancias
   entre horas del plan y la moda de los grupos del horario, en las 8 carreras DGAE).

**Por qué sube tanto la cobertura vs. PDF directo:** en la carpeta **nueva** el archivo
va prefijado con la clave (`1181-Etica-I.pdf`) → la clave es autoritativa y se toma
directo del nombre (sin adivinar). En la **vieja** el PDF tiene la clave en blanco, así
que ahí sí se cruza por nombre (DGAE da el nombre completo). El residuo sin cubrir son
optativas/seminarios viejos sin PDF dedicado o con nombre abreviado/typo en la carpeta
vieja; esas claves caen a modo *outlier* del detector (seguro, sin falsos positivos).

## 🚨 Cómo detectar que salió un plan nuevo

**Señal:** si al re-scrapear una carrera el **% de cobertura cae mucho** respecto al
semestre anterior → casi seguro **salió un plan de estudios nuevo** y el horario ahora
mezcla claves que no tienes cargadas. **No es un bug del scraper.**

**Qué hacer:**
1. Ir a DGAE-SIAE y listar los planes de la carrera (ver URLs abajo).
2. Mirar la columna **VIGENCIA** y la de **1a. GEN** (año de primera generación).
3. Agregar el/los `pde` nuevos al array de la carrera, **manteniendo** los viejos que
   sigan en "reinscripción".
4. Re-correr `node planes.mjs <codigo>` y verificar que la cobertura vuelve a subir.

## URLs de DGAE-SIAE (`www.dgae-siae.unam.mx/educacion/`)

| Para | URL |
|---|---|
| Lista de planes de una carrera (con **1a. GEN** y **VIGENCIA**) | `planes.php?plt=PLT&crr=CRR&acc=pde` |
| Estructura de un plan (claves ↔ nombres) | `planes.php?plt=PLT&crr=CRR&pde=PDE&acc=est` |
| Detalle de una asignatura (semestre, créditos — **sin horas**) | `asignaturas.php?plt=PLT&crr=CRR&pde=PDE&asg=CLAVE&ref=asgxpde` |
| Carreras de un plantel | `carreras.php?plt=PLT&crr=CRR` |

FES Acatlán está dividida por división (cada una es un `plt=02XX`). Se enumeran con
`planteles.php` (filtrar "F.E.S. ACATLAN"), y las carreras de cada división con
`carreras.php?plt=02XX`.

### Mapa completo carrera → (plt, crr) → link de planes

Todas las carreras de Acatlán en DGAE y su lista de planes (`&acc=pde`, con VIGENCIA y
1a. GEN). Las que rastreamos tienen código interno:

| Código | Carrera | plt / crr |
|---|---|---|
| 20121 | Arquitectura | 0201 / 102 |
| 20226 | Diseño Gráfico | 0202 / 406 |
| 20321 | Actuaría | 0203 / 101 |
| 20421 | Relaciones Internacionales | 0204 / 310 |
| 20422 | Ciencias Políticas y AP | 0204 / 303 |
| 20423 | Sociología | 0204 / 311 |
| 20425 | Comunicación | 0204 / 315 |
| 20721 | Derecho | 0207 / 305 |
| 20821 | Economía | 0208 / 306 |
| 21011 | Filosofía | 0210 / 411 |
| 21013 | Lengua y Literaturas Hispánicas | 0210 / 414 |
| 21021 | Historia | 0210 / 412 |
| 21025 | Pedagogía | 0210 / 421 |
| 21121 | Ingeniería Civil | 0211 / 107 |
| 24022 | Matemáticas Aplicadas y Computación | 0240 / 121 |
| 24121 | Enseñanza de Inglés | 0241 / 408 |
| *(sin rastrear)* | Periodismo | 0204 / 302 |
| *(sin rastrear)* | Técnico (Computación) | 0240 / 501 |
| *(sin rastrear)* | Enseñanza de Alemán/Español/Francés/Inglés/Italiano LE | 0243 / 424-428 |

Link de planes de cualquier fila: `planes.php?plt=<PLT>&crr=<CRR>&acc=pde`.
La tabla completa (con links absolutos) vive en `mapa-dgae-acatlan.csv`; se regenera
con `node _mapa-dgae.mjs`.

> **Nota:** DGAE **no** tiene horas ni links a los PDF. Solo da clave↔nombre, semestre y
> créditos. Las horas siempre vienen del PDF de `acatlan.unam.mx`.

## Match clave ↔ PDF (fuente DGAE)

Matching POR GENERACIÓN con **reclamo de PDF** (`matchGen()` en `planes.mjs`): cada PDF se
asigna a UNA sola clave, por orden de confianza. Cascada, contra la carpeta de su generación:

1. **clave-en-archivo**: si el nombre del PDF va prefijado con la clave (`1181-Etica-I`),
   esa clave es autoritativa (la saca el parser) → match directo. Cubre casi al 100% las
   carpetas de planes nuevos.
2. **alias** manual (config) → **nombre exacto**.
3. **canónico**: exacto tras normalizar abreviaturas SISTEMÁTICAS de DGAE — prefijo
   "Temas Selectos" (`TEM.SEL.`↔`T_S_de_`), `SIGLO(S)`→`S` (DGAE lo escribe, el archivo
   abrevia), sufijo `REQ` (marcador de asignatura-Requisito). Determinista, no fuzzy.
4. **subsecuencia única** (DGAE ⊆ archivo): la abreviatura de DGAE es subsecuencia del
   nombre completo; subsecuencia *única* auto-resuelve abreviaturas y rechaza ambigüedades.
5. **fuzzy** (coeficiente de Dice ≥0.72, con margen ≥0.08 sobre el 2º): recupera typos
   ("DIDICTICA") y variantes; el reclamo + el margen evitan robar PDFs a otra clave.

Los pares **I/II/III** y los **siglos** (XVI…XXI) se desambiguan por **conjunto de romanos**
(tokens del nombre crudo), no solo el romano final. El prefijo numérico del archivo (clave
`1181-` o semestre `01-`) se quita antes de normalizar.

**Fallback cross-generación:** si la carpeta de una clave NO tiene su PDF (link muerto 404
o faltante en el servidor), se busca por nombre **exacto/canónico** en las otras carpetas
vigentes (misma materia, mismas horas). **Solo si las horas son únicas** entre carpetas; si
difieren (la materia cambió de horas entre planes) NO se adivina → cae a modo outlier.

### Equivalencias curadas (materias renombradas entre planes)

A veces el horario de Acatlán etiqueta una optativa con la clave del **plan viejo** (cuyo
PDF es link muerto), mientras el plan vigente la **renombró y renumeró** — el matching por
nombre no las une porque el nombre cambió. Ejemplo real: en el horario, "Diseño y Elab. de
Recursos Didácticos" aparece como **0105** (plan 2007, PDF 404), pero el plan 2026 la llama
"Materiales y Recursos Didácticos" = **0240** (con horas). Es una inconsistencia de la UNAM
entre su sistema de horarios y el plan, no un bug nuestro.

Para cubrirlas hay un **mapa curado `EQUIVALENCIAS`** en `planes.mjs` (`{ codigoCarrera:
{ claveHorarioVieja: claveNuevaDelPlan } }`): la clave vieja hereda las horas de la nueva ya
emparejada. **Cada par se verifica a mano** y debe cumplir las 3 condiciones anti-falso-positivo:

1. **Renombre real**, no otra materia ni otro tomo de una secuencia I/II/III (p.ej. NO se
   puentea "Teoría Social IX" a "Teoría Social I" aunque compartan horas).
2. **Horas del plan nuevo == moda de horas de los grupos del horario** de la clave vieja.
3. **La clave nueva NO aparece en el horario** (si coexisten, son materias distintas, no
   un renombre → se descarta; así se filtró C. Políticas 1761→2706).

El detector revalida contra la moda de grupos, así que aunque una curación fuera errónea
solo degradaría a modo outlier — **nunca produce un falso positivo**. Pares actuales:
Derecho `1707→1710` (D. del Trabajo Parte Sustantiva, 16 grupos), Pedagogía `0105→0240` y
`0111→0244`, Historia `0042→0171` (Hist. Iglesia en Nueva España ≡ Novohispana), C. Políticas
`1761→2706` (Sist. de Partidos y Sist. Electorales) y `2126→1134` (Taller de Redacción e
Investig. Documental, cuya versión vieja es un PDF de tabla-de-temas sin resumen de horas),
RRII `2703→1768` (Análisis del Sector Externo de la Economía Mexicana). Robusto al
futuro: si la UNAM corrige el horario y empieza a usar la clave nueva, esa clave ya está
cubierta por su propio PDF, y la entrada vieja simplemente deja de aparecer (inofensiva).

**Variante "mismo semestre entre planes" (Arquitectura):** cuando la clave del horario es del
plan **nuevo** pero sus PDFs no existen aún (solo hay carpeta del plan viejo), se busca la
materia del **mismo semestre** en el plan viejo cuyo nombre corresponde, y se valida que sus
horas == la **mayoría de los grupos** de la clave nueva. Como el valor asignado es exactamente
esa mayoría, no puede generar un falso positivo. El valor de `EQUIVALENCIAS` admite el objeto
`{ tgt, nombre }` para estos casos (la clave nueva no está en la fuente del plan, así que se le
da su propio nombre). Pares: `1108→1100`, `1109→1105`, `1111→1103`, `1113→1106`.

**Fallback de optativas por carrera (detector):** en `detectar-anomalias.mjs`, el mapa
`OPTATIVA_FALLBACK` da horas esperadas a optativas sin plan, **por carrera**, cuando TODA la
bolsa optativa tiene las mismas horas (validado). Hoy: **Actuaría** — todas las optativas
(semestre `40` en el horario) son **4h** (verificado: las 11 con plan y sus grupos son 4h), así
que una optativa sin plan (p.ej. 2055 Series de Tiempo, que el endpoint no expone) se juzga
contra 4h en vez de quedar sin cubrir.

> **⚠️ Codificación DGAE:** las páginas de DGAE-SIAE se sirven en **ISO-8859-1**. Hay que
> decodificarlas como latin1 (`new TextDecoder('iso-8859-1')`), NO con `.text()` (UTF-8), o
> los acentos (Ñ, Á…) se corrompen y el match por nombre falla en silencio (p.ej. "ESPAÑA").

## ⚠️ Gotchas

- **Espacios en nombres de archivo.** Algunos PDFs tienen un espacio en el nombre
  (p.ej. `…CAPITALISTA- REPRODUCCION….pdf`). El regex que enumera PDFs **no** debe
  excluir `\s`, y hay que `encodeURI` la URL al descargar, o el PDF se cae en silencio.
- **Plantillas de horas (parsearPrograma).** Hay 4 familias de plantilla de PDF:
  A/C = fila de 4-7 enteros (`al-semestre semana teo pra …`, se valida con `al-sem ≈ 16×semana`);
  B = `Teóricas: N` / `Prácticas: N` con dos puntos; **D = doble columna "Semana | Semestre"
  SIN dos puntos, con la etiqueta repetida** (`Teóricas 4 Teóricas 64` / `Prácticas 0 Prácticas 0`)
  → se toma el 1er número (columna Semana). La D apareció en planes nuevos (Sociología 2022) y
  su firma "etiqueta N etiqueta M" es única, así que se agrega sin chocar con A/B. La invariante
  universal es `horas/semana = teóricas + prácticas (+ lab)`.
- **Cero falsos positivos** es prioritario. El detector solo marca un grupo si es
  **minoría** (la mayoría de los grupos sí cumple el esperado); si TODOS difieren del
  plan, no es error de carga sino que el plan cuenta las horas distinto (p.ej. incluye
  laboratorio) → no se marca.
- **Fallback de mayoría para TODA materia sin plan.** El detector usa la moda de las horas
  de los grupos como esperado incluso con <3 grupos (antes las omitía). Es seguro por la
  regla de minoría de arriba: con 1 grupo, o empate en 2, `afectados >= conformes` y no se
  marca nada. Así ninguna materia con horario queda sin valor esperado, sin arriesgar
  falsos positivos (las de 1-2 grupos tienen valor pero no pueden levantar alerta).
