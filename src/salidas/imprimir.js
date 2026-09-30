// Vistas de impresión (05-diseno §8.1; REQ-17, 20, 22, 24, 25, 26, 27, 28, 34, 35, 36, 62).
// `htmlDocumento` es pura; solo `imprimirDocumento` toca el DOM. Todo el texto visible sale de
// config/documentos.yaml (`textos`, `ci`, `anexos`, `documentos`) y de las reglas compuestas.
             
                                                                                 
                     
import { evaluarCondicion } from '../motor/condiciones.js';
import { aHtml, escaparHtml, sustituir } from '../motor/marcadores.js';
import { componerReglas, componerSecciones } from '../motor/componer.js';
import { motivosDecisivos } from '../motor/explicar.js';
import { ajustesEfectivos } from '../motor/ajustes.js';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Texto fijo de config/documentos.yaml; una clave ausente es un error de programación. */
function texto(ctx                , grupo        , clave        )         {
  const v = ctx.config.documentos.textos[grupo]?.[clave];
  if (v === undefined) throw new Error(`Falta el texto «${grupo}.${clave}» en config/documentos.yaml`);
  return v;
}

/** Texto de config con marcadores sustituidos, como HTML escapado. */
function html(ctx                , s        )         {
  return aHtml(sustituir(s, ctx.datos, ajustesEfectivos(ctx.config, ctx.resultado)));
}

function htmlTextos(ctx                , grupo        , clave        )         {
  return html(ctx, texto(ctx, grupo, clave));
}

function htmlDato(ctx                , id        )         {
  return html(ctx, `{${id}}`);
}

function vacio(ctx                , id        )          {
  return (ctx.datos[id] ?? '').trim() === '';
}

function contextoCondicion(ctx                )                    {
  const { resultado, datos } = ctx;
  return {
    respuestas: resultado.respuestas,
    condiciones: resultado.condiciones,
    datos,
    nivel: resultado.nivel,
    paquetes: resultado.paquetes,
    reglas: resultado.reglas.map((r) => r.id),
  };
}

function esBorrador(ctx                )          {
  return ctx.resultado.nivel === '1' || ctx.resultado.nivel === '2';
}

function nombreAnexo(ctx                , id        )         {
  return ctx.config.documentos.anexos.find((a) => a.id === id)?.nombre ?? id;
}

function nombreDocumento(ctx                , id        )         {
  return ctx.config.documentos.documentos.find((d) => d.id === id)?.nombre ?? id;
}

/**
 * Texto CSS entre comillas, seguro dentro de un `<style>`: escapa la barra invertida y las comillas
 * dobles, cambia los saltos de línea por un espacio y `<` por `\3C ` (nunca aparece `</style>`).
 */
export function cadenaCss(s        )         {
  return '"' + s
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('<', '\\3C ')
    .replace(/[\r\n\u2028\u2029]+/g, ' ') + '"';
}

/** Texto de config con marcadores sustituidos, como texto plano (para el CSS de @page). */
function plano(ctx                , s        )         {
  return sustituir(s, ctx.datos, ajustesEfectivos(ctx.config, ctx.resultado))
    .map((p) => (p.tipo === 'texto' ? p.texto : '[completar]'))
    .join('');
}

// ---------------------------------------------------------------------------
// Partes comunes (04-documentos §1)
// ---------------------------------------------------------------------------

function encabezado(ctx                , doc        , titulo        )         {
  // El CI lo recibe el participante: sin etiqueta de nivel ni línea BORRADOR en el encabezado; el BORRADOR
  // queda en el pie (04 §1.4, §5).
  const conMarcas = esBorrador(ctx) && doc !== 'DOC-CI';
  const c = (clave        )         => escaparHtml(texto(ctx, 'comun', clave));
  const fila = (etiqueta        , valor        , clase = '')         =>
    `<dt${clase === '' ? '' : ` class="${clase}"`}>${etiqueta}</dt><dd${clase === '' ? '' : ` class="${clase}"`}>${valor}</dd>`;
  // Etiqueta de nivel (solo niveles 1 y 2): «Nivel» + nombre del nivel de cuestionario.niveles.
  const nombreNivel = ctx.config.cuestionario.niveles.find((n) => n.id === ctx.resultado.nivel)?.nombre ?? '';
  const etiquetaNivel = conMarcas
    ? `<p class="etiqueta-nivel">${c('nivel')} ${escaparHtml(ctx.resultado.nivel)} — ${escaparHtml(nombreNivel)}</p>`
    : '';
  return [
    '<header class="encabezado">',
    // Membrete (04 §1.2): logotipo de ajustes.logo, cuyo texto alternativo es la línea institucional.
    '<div class="membrete">',
    `<img class="logo" src="${escaparHtml(ajustesEfectivos(ctx.config, ctx.resultado).logo)}" alt="${c('encabezado')}">`,
    `<p class="comite">${c('comite')}</p>`,
    '</div>',
    etiquetaNivel,
    `<h1>${titulo}</h1>`,
    '<dl class="identificacion">',
    fila(c('etiquetaTitulo'), htmlDato(ctx, 'D-TITULO'), 'ancho'),
    fila(c('etiquetaIr'), htmlDato(ctx, 'D-IR-NOMBRE')),
    fila(c('etiquetaUnidad'), htmlDato(ctx, 'D-IR-UNIDAD')),
    fila(c('etiquetaEstudiante'), htmlDato(ctx, 'D-EST-NOMBRE')),
    fila(c('etiquetaCarrera'), htmlDato(ctx, 'D-EST-CARRERA')),
    fila(c('fecha'), escaparHtml(ctx.fecha)),
    '</dl>',
    conMarcas ? `<p class="borrador">${c('borrador')}</p>` : '',
    '</header>',
  ].filter((x) => x !== '').join('\n');
}

function pie(ctx                )         {
  const partes = [
    htmlTextos(ctx, 'comun', 'pieVersion'),
    `${escaparHtml(texto(ctx, 'comun', 'pieGenerado'))} ${escaparHtml(ctx.fecha)}`,
  ];
  if (esBorrador(ctx)) partes.push(`<strong>${escaparHtml(texto(ctx, 'comun', 'borrador'))}</strong>`);
  // Pie repetido en cada página con las cajas de margen de @page (05-diseno §8.1). Solo entran textos de
  // config, versión y fecha (nunca datos D-*), como cadenas CSS escapadas.
  const izquierda = [
    plano(ctx, texto(ctx, 'comun', 'pieVersion')),
    `${texto(ctx, 'comun', 'pieGenerado')} ${ctx.fecha}`,
    ...(esBorrador(ctx) ? [texto(ctx, 'comun', 'borrador')] : []),
  ].join(' · ');
  const de = ` ${texto(ctx, 'comun', 'paginaDe')} `;
  const estilo = '<style>@page{'
    + `@bottom-left{content:${cadenaCss(izquierda)};font-size:8.5pt}`
    + `@bottom-right{content:${cadenaCss(`${texto(ctx, 'comun', 'piePagina')} `)} counter(page) ${cadenaCss(de)} counter(pages);font-size:8.5pt}`
    + '}</style>';
  // Respaldo en el flujo normal para navegadores sin cajas de margen.
  return `${estilo}\n<footer class="pie">${partes.map((p) => `<span>${p}</span>`).join(' · ')}</footer>`;
}

function articulo(ctx                , doc        , titulo        , cuerpo        )         {
  return [
    `<article class="documento" data-doc="${escaparHtml(doc)}">`,
    encabezado(ctx, doc, titulo),
    '<div class="cuerpo">',
    cuerpo,
    '</div>',
    pie(ctx),
    '</article>',
  ].join('\n');
}

function lineaFirma(ctx                , etiqueta        , nombreHtml        )         {
  return `<div class="firma"><div class="linea"></div><p>${escaparHtml(etiqueta)}: ${nombreHtml}</p><p>${escaparHtml(texto(ctx, 'comun', 'fecha'))}:</p></div>`;
}

function listaAnexos(ctx                , incluirDocs          )         {
  const items = ctx.resultado.anexos.map((id) => {
    const def = ctx.config.documentos.anexos.find((a) => a.id === id);
    const pre = def?.prellenadoPor === undefined
      ? ''
      : ` — ${escaparHtml(texto(ctx, 'comun', 'prellenado'))}`;
    return `<li>${escaparHtml(nombreAnexo(ctx, id))}${pre}</li>`;
  });
  for (const d of incluirDocs) {
    items.push(`<li>${escaparHtml(nombreDocumento(ctx, d))}</li>`);
  }
  return `<h2>${escaparHtml(texto(ctx, 'comun', 'anexosTitulo'))}</h2>\n<ul class="anexos">${items.join('')}</ul>`;
}

// ---------------------------------------------------------------------------
// DOC-CARTA-ADS (04 §2; REQ-20)
// ---------------------------------------------------------------------------

/** La vigencia indicada (AAAA-MM-DD) es anterior a la fecha de generación (04 §2; aviso en pantalla). */
export function certificadoVencido(ctx                )          {
  const v = (ctx.datos['D-ADS-VIGENCIA'] ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && v < ctx.fecha;
}

function cartaAds(ctx                )         {
  const t = (k        )         => htmlTextos(ctx, 'DOC-CARTA-ADS', k);
  const c = (k        )         => escaparHtml(texto(ctx, 'comun', k));
  const conRespaldo = !vacio(ctx, 'D-ADS-IR');
  // El respaldo solo se adjunta si D-ADS-IR está completado (el anexo de respaldo lleva su sufijo en el ID).
  const adjuntos = ctx.resultado.anexos.filter((id) => conRespaldo || !id.endsWith('-RESP-ADS'));
  const cuerpo = [
    `<p class="destinatario">${t('destinatario')}</p>`,
    `<p class="remitente">${c('etiquetaIr')}: ${htmlDato(ctx, 'D-IR-NOMBRE')}, ${htmlDato(ctx, 'D-IR-UNIDAD')}, ${htmlDato(ctx, 'D-IR-CORREO')}</p>`,
    `<p class="asunto"><strong>${t('asunto')}</strong></p>`,
    '<ol class="items">',
    `<li>${t('itemTitulo')}</li>`,
    `<li>${t('itemEstudiante')}</li>`,
    `<li>${t('itemProyecto')}${conRespaldo ? `<br>${t('respaldo')}` : ''}</li>`,
    `<li>${t('itemCertificado')}<br>${t('certificado')}</li>`,
    '</ol>',
    `<p>${t('declaracion')}</p>`,
    `<p>${t('nota')}</p>`,
    `<p class="propuesta">${htmlTextos(ctx, 'comun', 'propuesta')}</p>`,
    lineaFirma(ctx, texto(ctx, 'comun', 'firmaIr'), htmlDato(ctx, 'D-IR-NOMBRE')),
    `<h2>${c('anexosTitulo')}</h2>`,
    `<ul class="anexos">${adjuntos.map((id) => `<li>${escaparHtml(nombreAnexo(ctx, id))}</li>`).join('')}</ul>`,
  ].join('\n');
  return articulo(ctx, 'DOC-CARTA-ADS', t('titulo'), cuerpo);
}

// ---------------------------------------------------------------------------
// DOC-CONSTANCIA (04 §3; REQ-22)
// ---------------------------------------------------------------------------

function preguntaDe(ctx                , id        )                       {
  return ctx.config.cuestionario.bloques.flatMap((b) => b.preguntas).find((p) => p.id === id);
}

function constancia(ctx                )         {
  const t = (k        )         => htmlTextos(ctx, 'DOC-CONSTANCIA', k);
  const filas           = [];
  for (const id of ctx.resultado.visibles) {
    const p = preguntaDe(ctx, id);
    const r = ctx.resultado.respuestas[id];
    if (p === undefined || r === undefined) continue;
    const valores = Array.isArray(r) ? r : [r];
    const etiquetas = valores.map((v) => escaparHtml(p.opciones.find((o) => o.valor === v)?.etiqueta ?? v));
    const celda = Array.isArray(r) ? `<ul>${etiquetas.map((e) => `<li>${e}</li>`).join('')}</ul>` : etiquetas.join('');
    const nose = valores.includes('nose') ? ' class="nose"' : '';
    filas.push(`<tr${nose}><th scope="row">${escaparHtml(p.texto)}</th><td>${celda}</td></tr>`);
  }
  const alertas = ctx.resultado.alertas
    .map((id) => ctx.config.cuestionario.alertas.find((a) => a.id === id))
    .filter((a) => a !== undefined)
    .map((a) => `<li>${html(ctx, a.texto)}</li>`);
  const cuerpo = [
    `<p class="resultado"><strong>${t('resultado')}</strong></p>`,
    `<h2>${t('respuestasTitulo')}</h2>`,
    `<table class="respuestas"><tbody>${filas.join('')}</tbody></table>`,
    alertas.length > 0 ? `<h2>${t('alertasTitulo')}</h2>\n<ul class="alertas">${alertas.join('')}</ul>` : '',
    `<p>${t('recomendacion')}</p>`,
    `<p>${t('nota')}</p>`,
    `<p class="propuesta">${htmlTextos(ctx, 'comun', 'propuesta')}</p>`,
    lineaFirma(ctx, texto(ctx, 'comun', 'firmaIr'), htmlDato(ctx, 'D-IR-NOMBRE')),
  ].join('\n');
  return articulo(ctx, 'DOC-CONSTANCIA', t('titulo'), cuerpo);
}

// ---------------------------------------------------------------------------
// DOC-COMPROMISO (04 §4; REQ-24, REQ-25, REQ-17)
// ---------------------------------------------------------------------------

function compromiso(ctx                )         {
  const sufijo = ajustesEfectivos(ctx.config, ctx.resultado).redaccionNivel1;
  const t = (k        )         => htmlTextos(ctx, 'DOC-COMPROMISO', k);
  const c = (k        )         => escaparHtml(texto(ctx, 'comun', k));
  const fila = (etiqueta        , valor        )         => `<dt>${etiqueta}</dt><dd>${valor}</dd>`;

  const descripcion = [
    fila(t('etiquetaObjetivo'), htmlDato(ctx, 'D-OBJ-GENERAL')),
    fila(t('etiquetaResumen'), htmlDato(ctx, 'D-RESUMEN')),
    fila(t('etiquetaFechaInicio'), htmlDato(ctx, 'D-FECHA-INICIO')),
    !ctx.resultado.datos.includes('D-ORG-EXTERNA') || vacio(ctx, 'D-ORG-EXTERNA') ? '' : fila(t('etiquetaOrganizacion'), htmlDato(ctx, 'D-ORG-EXTERNA')),
    ctx.resultado.datos.includes('D-FUENTE-DATOS') ? fila(t('etiquetaFuenteDatos'), htmlDato(ctx, 'D-FUENTE-DATOS')) : '',
  ].join('');

  const motivos = motivosDecisivos(ctx.resultado).map((m) => `<li>${html(ctx, m.texto)}</li>`).join('');

  const reglas = componerReglas(ctx);
  const bloques           = [];
  for (const p of ctx.config.compromisos.paquetes) {
    const delPaquete = reglas.filter((r) => r.paquete === p.id);
    if (delPaquete.length === 0) continue;
    const items = delPaquete.map((r) => [
      '<div class="regla">',
      `<p><span class="id">${escaparHtml(r.id)}</span> <strong>${escaparHtml(r.titulo)}</strong> ${aHtml(r.compromiso)}</p>`,
      '</div>',
    ].join('')).join('\n');
    bloques.push(`<section class="paquete"><h3>${escaparHtml(p.id)} — ${escaparHtml(p.nombre)}</h3>\n${items}</section>`);
  }

  const filasFundamentos = reglas.map((r) =>
    `<tr><td class="fundamento-regla"><span class="id">${escaparHtml(r.id)}</span> ${escaparHtml(r.titulo)}</td><td>${escaparHtml(r.fundamento)}</td></tr>`).join('');

  const docsSinAnexo = ctx.resultado.documentos.filter((d) => d === 'DOC-PGD');
  const cuerpo = [
    `<h2>${t('descripcionTitulo')}</h2>`,
    `<dl class="descripcion">${descripcion}</dl>`,
    `<h2>${c('motivosTitulo')}</h2>`,
    `<ul class="motivos">${motivos}</ul>`,
    `<h2>${t('reglasTitulo')}</h2>`,
    bloques.join('\n'),
    `<h2>${t('generalesTitulo')}</h2>`,
    '<ul class="generales">',
    `<li>${t('generalCambios')}</li>`,
    ctx.resultado.nivel === '1' ? `<li class="inicio">${t(`inicio_${sufijo}`)}</li>` : '',
    `<li>${t('propuesta')}</li>`,
    '</ul>',
    `<h2>${t('firmasTitulo')}</h2>`,
    '<div class="firmas">',
    lineaFirma(ctx, texto(ctx, 'comun', 'firmaIr'), htmlDato(ctx, 'D-IR-NOMBRE')),
    lineaFirma(ctx, texto(ctx, 'comun', 'firmaEstudiante'), htmlDato(ctx, 'D-EST-NOMBRE')),
    '</div>',
    listaAnexos(ctx, docsSinAnexo),
    `<section class="fundamentos"><h2>${t('fundamentosTitulo')}</h2>`,
    `<p>${t('fundamentosIntro')}</p>`,
    `<table class="fundamentos"><thead><tr><th>${t('fundamentosRegla')}</th><th>${t('fundamentoEtiqueta')}</th></tr></thead><tbody>${filasFundamentos}</tbody></table></section>`,
  ].join('\n');
  return articulo(ctx, 'DOC-COMPROMISO', htmlTextos(ctx, 'DOC-COMPROMISO', `titulo_${sufijo}`), cuerpo);
}

// ---------------------------------------------------------------------------
// DOC-CI (04 §5, §5.1 bis, §5.2; REQ-26, REQ-27)
// ---------------------------------------------------------------------------

                             
                       
                                                                           
                             
                                        
                        
 

/** Reglas que una condición cita en positivo (las que están bajo `no` no afirman su contenido). */
function reglasCitadas(c           , negada = false)           {
  if ('regla' in c) return negada ? [] : [c.regla];
  if ('todas' in c) return c.todas.flatMap((x) => reglasCitadas(x, negada));
  if ('alguna' in c) return c.alguna.flatMap((x) => reglasCitadas(x, negada));
  if ('no' in c) return reglasCitadas(c.no, !negada);
  return [];
}

/**
 * Selecciona las variantes del CI que se cumplen (mixta → dos) y sus elementos vigentes. Los reemplazos
 * de 04 §5.1 bis por las respuestas (elementos `*_ir` con «___» y su nota) ya vienen condicionados en la
 * configuración. Aquí se aplica el reemplazo por regla no aceptada (W7; REQ-72): todo elemento cuya condición
 * cita en positivo una regla declarada no aceptada pasa a «___» (mismo título) con la nota al IR
 * `compromisos.noAceptada.notaCI`. Los elementos `*_ir` (ya en blanco, con su propia nota) y las notas al IR
 * no se tocan; una regla sin elemento en el CI (p. ej. `RP-PERS.8`) no cambia nada.
 */
export function seleccionarCi(ctx                )               {
  const cc = contextoCondicion(ctx);
  const cumple = (c                       )          => c === undefined || evaluarCondicion(c, cc);
  const declaradas = new Set(ctx.resultado.reglas.filter((r) => r.noAceptada === true).map((r) => r.id));
  const notaCI = ctx.config.compromisos.noAceptada.notaCI;
  const noAceptado = (e            )          =>
    e.notaIR !== true && !e.clave.endsWith('_ir') && e.si !== undefined
    && reglasCitadas(e.si).some((id) => declaradas.has(id));
  return ctx.config.documentos.ci.variantes
    .filter((v) => cumple(v.si))
    .map((variante) => {
      const vigentes = variante.elementos.filter((e) => cumple(e.si));
      const participante               = [];
      const notasIR               = [];
      const reemplazadas = new Set        ();
      let tituloGrupo                    ;
      for (const e of vigentes) {
        if (e.titulo !== undefined) tituloGrupo = e.titulo;
        if (declaradas.size > 0 && noAceptado(e)) {
          reemplazadas.add(e.clave);
          const en             = { clave: e.clave, texto: '___' };
          if (e.titulo !== undefined) en.titulo = e.titulo;
          participante.push(en);
          const nota             = { clave: `${e.clave}_nota_regla`, texto: notaCI, notaIR: true };
          if (tituloGrupo !== undefined) nota.titulo = tituloGrupo;
          notasIR.push(nota);
        } else if (e.notaIR === true) notasIR.push(e);
        else participante.push(e);
      }
      // La nota propia de un elemento reemplazado (`<clave>_nota`) ya no describe lo que se imprime.
      return { variante, participante, notasIR: notasIR.filter((n) => !reemplazadas.has(n.clave.replace(/_nota$/, '')) || n.clave.endsWith('_nota_regla')) };
    });
}

/** El elemento con esta clave es la pregunta de aceptación de la variante por casilla (04 §5.2). */
const CLAVE_ACEPTACION = 'opciones';

function cuerpoCi(ctx                , v            )         {
  const t = (k        )         => htmlTextos(ctx, 'DOC-CI', k);
  const salida           = [];
  let tituloPrevio                    ;
  for (const e of v.participante) {
    if (e.titulo !== undefined && e.titulo !== tituloPrevio) {
      salida.push(`<h3>${escaparHtml(e.titulo)}</h3>`);
      tituloPrevio = e.titulo;
    }
    if (e.texto.includes('\n')) {
      // Cada línea del texto (p. ej. cada firma) va en su propio bloque.
      const clase = e.clave === 'firmas' ? 'firma-ci' : 'linea-ci';
      salida.push(...e.texto.split('\n').filter((l) => l.trim() !== '').map((l) => `<p class="${clase}">${html(ctx, l)}</p>`));
    } else {
      salida.push(`<p>${html(ctx, e.texto)}</p>`);
    }
    if (e.clave === CLAVE_ACEPTACION) {
      salida.push(`<p class="casilla">${t('aceptar')}</p>`, `<p class="casilla">${t('noAceptar')}</p>`);
    }
  }
  const notas = v.notasIR.map((e) => {
    const titulo = e.titulo === undefined ? '' : `<strong>${escaparHtml(e.titulo)}.</strong> `;
    return `<p>${titulo}${html(ctx, e.texto)}</p>`;
  });
  const bloqueNotas = notas.length === 0
    ? ''
    : `<aside class="nota-ir"><h3>${t('notaIrTitulo')}</h3>\n${notas.join('\n')}</aside>`;
  return `<section class="ci-variante" data-variante="${escaparHtml(v.variante.clave)}">\n<h2>${escaparHtml(v.variante.titulo)}</h2>\n${salida.join('\n')}\n${bloqueNotas}\n</section>`;
}

function consentimiento(ctx                )         {
  const variantes = seleccionarCi(ctx);
  const partes           = [];
  if (variantes.length > 1) {
    partes.push(`<aside class="nota-ir nota-mixta"><p>${htmlTextos(ctx, 'DOC-CI', 'notaMixta')}</p></aside>`);
  }
  partes.push(...variantes.map((v) => cuerpoCi(ctx, v)));
  partes.push(`<p class="propuesta">${htmlTextos(ctx, 'comun', 'propuesta')}</p>`);
  return articulo(ctx, 'DOC-CI', escaparHtml(nombreDocumento(ctx, 'DOC-CI')), partes.join('\n'));
}

// ---------------------------------------------------------------------------
// DOC-PGD (04 §6; REQ-28)
// ---------------------------------------------------------------------------

function pgd(ctx                )         {
  const t = (k        )         => htmlTextos(ctx, 'DOC-PGD', k);
  const completarPista = escaparHtml(texto(ctx, 'DOC-F04', 'completarPista'));
  const secciones = componerSecciones(['F04-IV'], ctx, { exclusiones: false });
  const cuerpoSecciones = secciones.map((s) => {
    const items = s.items.map((it) => {
      const num = it.id === undefined ? '' : `<span class="num">${escaparHtml(it.id.replace(/^[^-]*-/, ''))}</span> `;
      const cuerpo = it.estado === 'completar' ? '<mark class="completar">[completar]</mark>' : aHtml(it.respuesta);
      const pista = it.pista === undefined ? '' : `<p class="pista"><em>${completarPista} ${escaparHtml(it.pista)}</em></p>`;
      return `<div class="item"><p class="enunciado"><strong>${num}${escaparHtml(it.enunciado)}</strong></p><p class="respuesta">${cuerpo}</p>${pista}</div>`;
    }).join('\n');
    return `<section class="seccion"><h2>${escaparHtml(s.titulo)}</h2>\n${items}</section>`;
  }).join('\n');
  const responsable = [
    `<dt>${escaparHtml(texto(ctx, 'comun', 'etiquetaIr'))}</dt><dd>${htmlDato(ctx, 'D-IR-NOMBRE')}</dd>`,
    `<dt>${escaparHtml(texto(ctx, 'comun', 'etiquetaEstudiante'))}</dt><dd>${htmlDato(ctx, 'D-EST-NOMBRE')}</dd>`,
  ].join('');
  const cuerpo = [
    `<p class="introduccion">${t('introduccion')}</p>`,
    cuerpoSecciones,
    `<section class="responsable"><h2>${t('responsableTitulo')}</h2><dl>${responsable}</dl>\n<p>${t('conservacion')}</p>\n<p>${t('viaDerechos')}</p></section>`,
    `<p class="propuesta">${htmlTextos(ctx, 'comun', 'propuesta')}</p>`,
    lineaFirma(ctx, texto(ctx, 'comun', 'firmaIr'), htmlDato(ctx, 'D-IR-NOMBRE')),
  ].join('\n');
  return articulo(ctx, 'DOC-PGD', t('titulo'), cuerpo);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Fragmento `<article class="documento">` de DOC-CARTA-ADS, DOC-CONSTANCIA, DOC-COMPROMISO, DOC-CI o DOC-PGD. Puro. */
export function htmlDocumento(doc        , ctx                )         {
  switch (doc) {
    case 'DOC-CARTA-ADS': return cartaAds(ctx);
    case 'DOC-CONSTANCIA': return constancia(ctx);
    case 'DOC-COMPROMISO': return compromiso(ctx);
    case 'DOC-CI': return consentimiento(ctx);
    case 'DOC-PGD': return pgd(ctx);
    default: throw new Error(`htmlDocumento: documento no imprimible «${doc}»`);
  }
}

/** Inserta el documento en `#impresion`, llama a `window.print()` y lo retira en `afterprint`. */
export function imprimirDocumento(doc        , ctx                )       {
  const contenedor = document.getElementById('impresion');
  if (contenedor === null) throw new Error('imprimirDocumento: falta el elemento #impresion en index.html');
  contenedor.innerHTML = htmlDocumento(doc, ctx);
  const retirar = ()       => {
    contenedor.innerHTML = '';
    window.removeEventListener('afterprint', retirar);
  };
  window.addEventListener('afterprint', retirar);
  // El logotipo debe estar decodificado antes de imprimir; si falla, se imprime con su texto alternativo.
  const imagenes = [...contenedor.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined));
  void Promise.all(imagenes).then(() => window.print());
}
