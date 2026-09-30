// F04 reducido como .doc compatible con Word (05-diseno §8.2, 04-documentos §7; REQ-17, 30, 31, 34, 38).
// Puro salvo `descargarF04`, que usa el DOM.
                                                                                   
import { componerSecciones } from '../motor/componer.js';
import { aHtml, aTexto, escaparHtml, sustituir } from '../motor/marcadores.js';
import { ajustesEfectivos } from '../motor/ajustes.js';

const ESTILOS = `
  /* A4 */ @page { size: 21.0cm 29.7cm; margin: 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; }
  h1 { font-size: 16pt; margin: 6pt 0; }
  h2 { font-size: 13pt; margin: 16pt 0 6pt 0; border-bottom: 1px solid #444; }
  p { margin: 3pt 0; }
  table { border-collapse: collapse; width: 100%; }
  td { border: 1px solid #888; padding: 4pt; vertical-align: top; }
  .institucion { font-size: 10pt; color: #333; }
  .borrador { font-weight: bold; color: #9c0006; border: 1px solid #9c0006; padding: 3pt; }
  .motivos { border: 2px solid #1f4e79; background: #eaf1f8; padding: 6pt; margin: 8pt 0; }
  .enunciado { font-weight: bold; margin-top: 8pt; }
  .pista { font-style: italic; color: #555; }
  .instruccion { font-style: italic; }
  mark.completar { background: #ffff00; }
  .pie { margin-top: 20pt; border-top: 1px solid #444; font-size: 9pt; color: #333; }
`;

const COMPLETAR = '<p><mark class="completar">[completar]</mark></p>';

/** Agrega el punto final salvo que el texto ya termine en puntuación (05 §8.2). */
/** «título» (RP-X.n) de cada regla, unidos como enumeración en español («a, b y c»). */
function listaReglas(ctx                , ids          )         {
  const titulo = (id        )         =>
    ctx.config.compromisos.paquetes.flatMap((p) => p.reglas).find((r) => r.id === id)?.titulo ?? id;
  return new Intl.ListFormat('es', { type: 'conjunction' }).format(ids.map((id) => `«${titulo(id)}» (${id})`));
}

function conPuntoFinal(texto        )         {
  return /[.!?…]$/.test(texto) ? texto : `${texto}.`;
}

/** Número oficial `n.m` de un ítem con id `F04-n.m`; vacío en los demás (05 §8.2). */
function numeroOficial(id                    )         {
  const m = id === undefined ? null : /^F04-(\d+\.\d+)$/.exec(id);
  return m === null ? '' : `${m[1]} `;
}

/** Bloque de respuesta de un ítem (estado → HTML). */
function htmlItem(it               , ctx                , textos                        )         {
  const partes           = [];
  const pistaHtml = (texto        , conPrefijo         )         => {
    const prefijo = conPrefijo ? `${escaparHtml(textos.completarPista)} ` : '';
    return `<p class="pista">${prefijo}${escaparHtml(texto)}</p>`;
  };
  if (it.listaAnexos === true) {
    const prellenado = ctx.config.documentos.textos.comun.prellenado;
    const filas = ctx.resultado.anexos.map((id) => {
      const a = ctx.config.documentos.anexos.find((x) => x.id === id);
      const pre = a?.prellenadoPor === undefined ? '' : ` — ${escaparHtml(prellenado)}`;
      return `<li>${escaparHtml(a === undefined ? '' : a.nombre)}${pre}</li>`;
    });
    partes.push(`<ul>${filas.join('')}</ul>`);
  } else if (it.estado === 'completar') {
    if (it.id === undefined) {
      partes.push('<p>&nbsp;</p>');   // firma y fecha de la declaración: en blanco
    } else {
      partes.push(COMPLETAR);
      if (it.pista !== undefined) {
        const esAviso = it.exclusiones.length > 0 && it.pista.startsWith(textos.noPrellenado);
        partes.push(pistaHtml(it.pista, !esAviso));
      }
    }
  } else if (it.estado === 'sugerencia') {
    partes.push(`<p class="pista">${escaparHtml(textos.sugerenciaEtiqueta)}: ${it.sugerencia === undefined ? '' : aHtml(it.sugerencia)}</p>`);
    partes.push(COMPLETAR);
    if (it.pista !== undefined) partes.push(pistaHtml(it.pista, true));
  } else {
    partes.push(`<p>${aHtml(it.respuesta)}</p>`);
    if (it.estado === 'parcial') {
      // Prellenado en parte (04-documentos §7.1): la pista nombra lo omitido; una pista por motivo.
      const porMotivo = new Map                  ();
      for (const e of it.exclusiones) {
        const reglas = porMotivo.get(e.motivo) ?? [];
        if (!reglas.includes(e.regla)) reglas.push(e.regla);
        porMotivo.set(e.motivo, reglas);
      }
      for (const [motivo, reglas] of porMotivo) {
        partes.push(`<p class="pista">${escaparHtml(`${textos.omitidoParcial} ${listaReglas(ctx, reglas)} ${textos.omitidoPorque} ${conPuntoFinal(motivo)}`)}</p>`);
      }
    }
    if (it.pista !== undefined) partes.push(pistaHtml(it.pista, true));
  }
  return partes.join('');
}

function htmlSeccion(sec                  , ctx                , textos                        )         {
  const cab = `<h2>${escaparHtml(sec.titulo)}</h2>`
    + (sec.instruccion === undefined ? '' : `<p class="instruccion">${escaparHtml(sec.instruccion)}</p>`);
  if (sec.id === 'F04-I') {
    const filas = sec.items.map((it) =>
      `<tr><td width="35%"><b>${escaparHtml(numeroOficial(it.id) + it.enunciado)}</b></td><td>${htmlItem(it, ctx, textos)}</td></tr>`);
    return `${cab}<table>${filas.join('')}</table>`;
  }
  const items = sec.items.map((it) =>
    `<p class="enunciado">${escaparHtml(numeroOficial(it.id) + it.enunciado)}</p>${htmlItem(it, ctx, textos)}`);
  return cab + items.join('');
}

/** Documento HTML completo con espacios de nombres de Word. Puro. */
export function htmlF04(ctx                )         {
  const { config, resultado, datos, fecha } = ctx;
  const comun = config.documentos.textos.comun;
  const textos = config.documentos.textos['DOC-F04'];
  const ajustes = ajustesEfectivos(config, resultado);
  // Motivos de nivel 2: de preguntas, globales o de reglas no aceptadas (origen `regla`); solo se muestra su texto.
  const motivos = resultado.motivos.filter((m) => m.nivel === '2');
  const secciones = componerSecciones(resultado.seccionesF04, ctx, { exclusiones: true });

  const recuadro = `<div class="motivos"><p><b>${escaparHtml(textos.motivosTitulo)}</b></p>`
    + `<p class="pista">${escaparHtml(textos.motivosAviso)}</p>`
    + `<ul>${motivos.map((m) => `<li>${aHtml(sustituir(m.texto, datos, ajustes))}</li>`).join('')}</ul></div>`;

  const pie = `<div class="pie"><p>${aHtml(sustituir(comun.pieVersion, datos, ajustes))} · `
    + `${escaparHtml(comun.pieGenerado)} ${escaparHtml(fecha)}</p>`
    + `<p class="borrador">${escaparHtml(comun.borrador)}</p></div>`;

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>${escaparHtml(textos.titulo)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>${ESTILOS}</style>
</head>
<body>
<p class="institucion">${escaparHtml(comun.encabezado)}</p>
<h1>${escaparHtml(textos.titulo)}</h1>
<p class="borrador">${escaparHtml(comun.borrador)}</p>
<p class="pista">${escaparHtml(comun.propuesta)}</p>
${recuadro}
${secciones.map((s) => htmlSeccion(s, ctx, textos)).join('\n')}
${pie}
</body>
</html>
`;
}

/** Segmento seguro para nombres de archivo: sin tildes, solo letras, dígitos y guiones. */
function segmentoSeguro(texto        , largo        )         {
  const s = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, largo).replace(/-+$/, '');
}

/** `F04-<título abreviado>-<fecha>.doc`, apto para cualquier sistema de archivos. Puro. */
export function nombreArchivoF04(titulo                    , fecha        )         {
  const abreviado = segmentoSeguro(titulo ?? '', 40);
  const f = segmentoSeguro(fecha, 10);
  return ['F04', abreviado === '' ? 'MT' : abreviado, f === '' ? 'sin-fecha' : f].join('-') + '.doc';
}

/** Descarga `F04-<título abreviado>-<fecha>.doc` (`application/msword`). */
export function descargarF04(ctx                )       {
  const blob = new Blob([htmlF04(ctx)], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivoF04(ctx.datos['D-TITULO'], ctx.fecha);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
