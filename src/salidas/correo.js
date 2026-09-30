// Correo al CEBB (05-diseno §8.3, 04-documentos §8; REQ-30, 31, 32, 33, 34). Puro.
                                                                            
import { aTexto, sustituir } from '../motor/marcadores.js';
import { ajustesEfectivos } from '../motor/ajustes.js';

const LIMITE_HREF = 1800;

/** Adjuntos: cada ANX-* del motor y los documentos PDF sin ANX-* propio que se ofrecen (REQ-31). */
function adjuntosDe(ctx                )            {
  const { config, resultado } = ctx;
  const ajustes = ajustesEfectivos(config, resultado)                                      ;
  const adjuntos            = [];
  for (const id of resultado.anexos) {
    const a = config.documentos.anexos.find((x) => x.id === id);
    if (a === undefined) continue;
    const adj          = { id: a.id, nombre: a.nombre };
    if (a.prellenadoPor !== undefined) adj.prellenadoPor = a.prellenadoPor;
    if (a.enlace !== undefined) adj.enlace = String(ajustes[a.enlace]);
    adjuntos.push(adj);
  }
  const conAnexo = new Set(config.documentos.anexos.flatMap((a) => (a.prellenadoPor === undefined ? [] : [a.prellenadoPor])));
  for (const d of config.documentos.documentos) {
    if (d.formato !== 'pdf' || conAnexo.has(d.id) || !resultado.documentos.includes(d.id)) continue;
    if (d.id === 'DOC-CONSTANCIA') continue;   // constancia del nivel 0: no se envía al CEBB
    adjuntos.push({ id: d.id, nombre: d.nombre });
  }
  return adjuntos;
}

function linea(a         , prellenado        , completado                         , completadoPdf        )         {
  let pre = '';
  if (a.prellenadoPor !== undefined) pre = ` — ${completado(a.prellenadoPor) ? completadoPdf : prellenado}`;
  return `- ${a.nombre}${pre}`;
}

export function construirCorreo(ctx                )         {
  const { config, resultado, datos } = ctx;
  const t = config.documentos.textos['DOC-CORREO'];
  const ajustes          = ajustesEfectivos(config, resultado);
  const nivel = resultado.nivel;
  if (nivel !== 'A' && nivel !== '1' && nivel !== '2') {
    throw new Error('El correo al CEBB solo existe para los niveles A, 1 y 2');
  }
  const sufijo = nivel === '1' ? `${nivel}_${ajustes.redaccionNivel1}` : nivel;
  const texto = (plantilla        )         => aTexto(sustituir(plantilla, datos, ajustes));

  const asunto = texto(t[`asunto_${sufijo}`]);
  const adjuntos = adjuntosDe(ctx);
  const prellenado = config.documentos.textos.comun.prellenado;
  const completado = (id        )          => config.documentos.documentos.some((d) => d.id === id && d.formato === 'doc');

  const lista           = [];
  if (nivel === '1') {
    lista.push(`${t.paquetesTitulo}: ${resultado.paquetes.map((id) => `${config.compromisos.paquetes.find((p) => p.id === id)?.nombre ?? id} (${id})`).join(', ')}`);
  } else if (nivel === '2') {
    lista.push(`${t.motivosTitulo}:`);
    for (const m of resultado.motivos.filter((x) => x.nivel === '2')) lista.push(`- ${texto(m.texto)}`);
  }

  const cuerpoCon = (comentario        )         => {
    const bloques           = [t.saludo, texto(t[`cuerpo_${sufijo}`])];
    if (lista.length > 0) bloques.push(lista.join('\n'));
    if (comentario !== '') bloques.push(`${t.comentarioTitulo}:\n${comentario}`);
    bloques.push(`${t.adjuntosTitulo}:\n${adjuntos.map((a) => linea(a, prellenado, completado, t.completadoPdf)).join('\n')}`);
    if (nivel === '2') bloques.push(t.justificarAnexos);
    bloques.push(texto(t.cierre));
    return bloques.join('\n\n');
  };
  const hrefCon = (cuerpo        )         =>
    `mailto:${ajustes.correoCebb}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  const comentario = (datos['D-COMENTARIO'] ?? '').trim();
  const cuerpo = cuerpoCon(comentario);
  let href = hrefCon(cuerpo);
  let recortado = false;

  if (href.length > LIMITE_HREF && comentario !== '') {
    recortado = true;
    const simbolos = Array.from(comentario);
    const recorte = (n        )         => (n <= 0 ? '' : simbolos.slice(0, n).join('').trimEnd() + '…');
    let bajo = 0;                    // 0 = sin comentario (siempre es la opción más corta)
    let alto = simbolos.length - 1;  // la versión completa ya no cabe
    while (bajo < alto) {
      const medio = Math.ceil((bajo + alto) / 2);
      if (hrefCon(cuerpoCon(recorte(medio))).length <= LIMITE_HREF) bajo = medio;
      else alto = medio - 1;
    }
    href = hrefCon(cuerpoCon(recorte(bajo)));
  }

  return { para: ajustes.correoCebb, asunto, cuerpo, href, recortado, adjuntos };
}
