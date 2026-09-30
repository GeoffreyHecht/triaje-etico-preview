// Pantalla de documentos (05-diseno §7.1, paso 4; REQ-16, 19, 33, 35, 46, 57).
// Lista numerada de pasos del trámite: datos del proyecto, un paso por documento y el correo.
// Los documentos se despachan por `formato`, no por ID de documento.
                                                
import { construirCorreo } from '../salidas/correo.js';
import { descargarF04 } from '../salidas/doc.js';
import { imprimirDocumento } from '../salidas/imprimir.js';
import { cambiarDato, camposDocumentos, documentosHabilitados, ID_COMENTARIO } from './estado.js';
import { h } from './dom.js';
import { campoDato, textoFaltantes } from './pantallas.js';
import { pantallaPendientes } from './resultado.js';
                                          

function esEnlaceWeb(texto        )          {
  try {
    const u = new URL(texto);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function botonDocumento(s        , doc              )                     {
  let etiqueta        ;
  let accion            ;
  if (doc.formato === 'pdf') {
    etiqueta = s.t('imprimir');
    accion = () => imprimirDocumento(doc.id, s.ctx());
  } else if (doc.formato === 'doc') {
    etiqueta = s.t('descargarDoc');
    accion = () => descargarF04(s.ctx());
  } else {
    return null; // `mailto` es el paso del correo y `json` la exportación del borrador.
  }
  const b = h('button', { type: 'button', class: 'primario' }, etiqueta);
  b.addEventListener('click', accion);
  return b;
}

// ---------------------------------------------------------------------------
// Correo
// ---------------------------------------------------------------------------

/** Contenido del paso del correo (sin el título, que lo pone la lista de pasos). */
function contenidoCorreo(s        )                {
  const correo = construirCorreo(s.ctx());
  const campo = s.config.cuestionario.datos.find((c) => c.id === ID_COMENTARIO);
  const marca = s.config.documentos.textos.comun?.prellenado;
  const enlace = h('a', { id: 'correo-enlace', class: 'boton primario', href: correo.href }, s.t('abrirCorreo'));
  const asunto = h('span', { id: 'correo-asunto' }, correo.asunto);
  const recorte = h('p', { id: 'correo-recorte', class: 'aviso-campo', role: 'status' }, s.t('correoRecortado'));
  const copia = h('textarea', { id: 'correo-cuerpo', rows: '10', readonly: true, 'aria-label': s.t('cuerpoCompleto') }, correo.cuerpo)                       ;
  const estadoCopia = h('p', { id: 'correo-copia-estado', role: 'status' });
  const copiar = h('button', { type: 'button', class: 'secundario' }, s.t('copiarCorreo'));
  const cajaCopia = h('div', { id: 'correo-caja' },
    h('label', { for: 'correo-cuerpo' }, s.t('cuerpoCompleto')), copia, copiar, estadoCopia);
  copiar.addEventListener('click', () => {
    copia.select();
    const exito = () => { estadoCopia.textContent = s.t('copiado'); };
    const fallo = () => { estadoCopia.textContent = s.t('copiarFallo'); };
    try {
      if (navigator.clipboard !== undefined) navigator.clipboard.writeText(copia.value).then(exito, fallo);
      else if (document.execCommand('copy')) exito();
      else fallo();
    } catch {
      fallo();
    }
  });
  const mostrarRecorte = (recortado         ) => {
    recorte.hidden = !recortado;
    cajaCopia.hidden = !recortado;
  };
  mostrarRecorte(correo.recortado);

  const partes                = [
    h('p', {}, h('strong', {}, `${s.t('correoPara')}: `), correo.para),
    h('p', {}, h('strong', {}, `${s.t('correoAsunto')}: `), asunto),
  ];

  if (campo !== undefined) {
    const area = h('textarea', { id: 'dato_comentario', rows: '4', 'aria-describedby': 'dato_comentario_ayuda' }, s.estado.datos[ID_COMENTARIO] ?? '')                       ;
    area.addEventListener('input', () => {
      s.aplicarSuave(cambiarDato(s.estado, s.config, ID_COMENTARIO, area.value));
      actualizarCorreo(s);
    });
    partes.push(h('div', { class: 'campo' },
      h('label', { for: 'dato_comentario' }, campo.etiqueta),
      campo.ayuda !== undefined ? h('p', { id: 'dato_comentario_ayuda', class: 'ayuda-campo' }, campo.ayuda) : null,
      area));
  }

  // Adjuntos por nombre: nunca se muestran los IDs ANX-* / DOC-* (04-documentos §1.3).
  const lista = h('ul', { class: 'adjuntos' });
  for (const a of correo.adjuntos) {
    const id = `adjunto_${a.id}`;
    const caja = h('input', { type: 'checkbox', id, checked: s.adjuntosMarcados.has(a.id) })                    ;
    caja.checked = s.adjuntosMarcados.has(a.id);
    caja.addEventListener('change', () => {
      if (caja.checked) s.adjuntosMarcados.add(a.id);
      else s.adjuntosMarcados.delete(a.id);
    });
    const prellenado = a.prellenadoPor !== undefined && marca !== undefined ? ` — ${marca}` : '';
    lista.append(h('li', {},
      caja,
      h('label', { for: id }, `${a.nombre}${prellenado}`),
      a.enlace !== undefined && esEnlaceWeb(a.enlace)
        ? h('a', { href: a.enlace, target: '_blank', rel: 'noopener noreferrer' }, s.t('adjuntoEnlace'))
        : null));
  }
  partes.push(h('h4', {}, s.t('adjuntosTitulo')), h('p', {}, s.t('adjuntosVerificar')), lista,
    h('p', { class: 'nota' }, s.t('correoAviso')), recorte, enlace, cajaCopia);
  return partes;
}

/** Recalcula el enlace, el asunto y el cuadro de copia tras editar el comentario (sin redibujar). */
export function actualizarCorreo(s        )       {
  const enlace = document.getElementById('correo-enlace');
  if (enlace === null) return;
  const correo = construirCorreo(s.ctx());
  enlace.setAttribute('href', correo.href);
  const asunto = document.getElementById('correo-asunto');
  if (asunto !== null) asunto.textContent = correo.asunto;
  const cuerpo = document.getElementById('correo-cuerpo')                              ;
  if (cuerpo !== null) cuerpo.value = correo.cuerpo;
  const recorte = document.getElementById('correo-recorte');
  if (recorte !== null) recorte.hidden = !correo.recortado;
  const caja = document.getElementById('correo-caja');
  if (caja !== null) caja.hidden = !correo.recortado;
}

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------

export function pantallaDocumentos(s        )              {
  const { config, resultado } = s;
  if (!documentosHabilitados(resultado)) return pantallaPendientes(s, s.t('tituloDocumentos'));
  const raiz = h('div', { class: 'pantalla' },
    h('h2', { id: 'titulo-pantalla', tabindex: '-1' }, s.t('tituloDocumentos')),
    h('p', { class: 'intro' }, s.t('introDocumentos')));
  const pasos = h('ol', { class: 'pasos-tramite' });

  // 1. Datos del proyecto (inicio y los que pide el resultado).
  const datos = h('li', { class: 'paso-tramite' }, h('h3', {}, s.t('pasoDatosProyecto')));
  for (const c of camposDocumentos(config, resultado)) datos.append(campoDato(s, c));
  const textoFalta = textoFaltantes(s);
  datos.append(h('p', { id: 'datos-faltantes', class: 'aviso-campo datos-faltantes', hidden: textoFalta === '' }, textoFalta));
  pasos.append(datos);

  // 2. Un paso por documento que se imprime o descarga.
  const docs = resultado.documentos
    .map((id) => config.documentos.documentos.find((d) => d.id === id))
    .filter((d)                    => d !== undefined);
  for (const d of docs) {
    const b = botonDocumento(s, d);
    if (b === null) continue;
    pasos.append(h('li', { class: 'paso-tramite' },
      h('h3', {}, d.nombre),
      d.instruccion !== undefined ? h('p', { class: 'instruccion' }, d.instruccion) : null,
      b));
  }

  // 3. Correo al CEBB, si corresponde.
  if (docs.some((d) => d.formato === 'mailto')) {
    pasos.append(h('li', { class: 'paso-tramite correo' }, h('h3', {}, s.t('correoTitulo')), ...contenidoCorreo(s)));
  }
  raiz.append(pasos);

  // Fuera de la numeración: exportación del borrador y «Anterior».
  const nav = h('div', { class: 'botones-paso' });
  const atras = h('button', { type: 'button', class: 'secundario' }, s.t('anterior'));
  atras.addEventListener('click', () => s.retroceder());
  nav.append(atras);
  raiz.append(nav);
  return raiz;
}
