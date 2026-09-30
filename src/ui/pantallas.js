// Pantallas de inicio y cuestionario (05-diseno §7.1, §7.4; REQ-13, 19, 48, 63, 64).
                                                       
import { alternarOpcion, bloqueDePaso, cambiarDato, datosFaltantes, preguntasDePaso, responder } from './estado.js';
                                        
import { conHtml, h } from './dom.js';
import { ayudaHtml } from './formato.js';
                                          

export function titulo(texto        )              {
  return h('h2', { id: 'titulo-pantalla', tabindex: '-1' }, texto);
}

export function botones(s        , conAnterior         , etiquetaSiguiente               )              {
  const nav = h('div', { class: 'botones-paso' });
  if (conAnterior) {
    const a = h('button', { type: 'button', class: 'secundario' }, s.t('anterior'));
    a.addEventListener('click', () => s.retroceder());
    nav.append(a);
  }
  if (etiquetaSiguiente !== null) {
    const b = h('button', { type: 'button', class: 'primario' }, etiquetaSiguiente);
    b.addEventListener('click', () => s.avanzar());
    nav.append(b);
  }
  return nav;
}

// ---------------------------------------------------------------------------
// Campos de datos
// ---------------------------------------------------------------------------

/** Línea de la pantalla de documentos con los datos `requerido` vacíos ('' si no falta ninguno). */
export function textoFaltantes(s        )         {
  const n = datosFaltantes(s.config, s.resultado, s.estado.datos).length;
  if (n === 0) return '';
  return n === 1 ? s.t('datosFaltantesUno') : s.t('datosFaltantes').replace('%n', String(n));
}

/** Actualiza la línea de datos faltantes al escribir, sin redibujar. */
export function actualizarFaltantes(s        )       {
  const p = document.getElementById('datos-faltantes');
  if (p === null) return;
  const texto = textoFaltantes(s);
  p.textContent = texto;
  p.hidden = texto === '';
}

export function campoDato(s        , c           )              {
  const id = `dato_${c.id}`;
  const ayudaId = `${id}_ayuda`;
  const avisoId = `${id}_aviso`;
  const valor = s.estado.datos[c.id] ?? '';
  const tipoInput = c.tipo === 'correo' ? 'email' : c.tipo === 'fecha' ? 'date' : 'text';
  const describe = [c.ayuda !== undefined ? ayudaId : '', avisoId].filter((x) => x !== '').join(' ');
  const control = c.tipo === 'parrafo'
    ? h('textarea', { id, rows: '4', 'aria-describedby': describe }, valor)
    : h('input', { id, type: tipoInput, value: valor, 'aria-describedby': describe, autocomplete: 'off' });
  const aviso = h('p', { id: avisoId, class: 'aviso-campo' }, s.t('avisoCampoVacio'));
  const actualizarAviso = () => {
    const vacio = (control                    ).value.trim() === '';
    aviso.hidden = !(c.requerido === true && vacio && s.tocados.has(c.id));
  };
  actualizarAviso();
  control.addEventListener('input', () => {
    s.aplicarSuave(cambiarDato(s.estado, s.config, c.id, (control                    ).value));
    actualizarAviso();
    actualizarFaltantes(s);
  });
  control.addEventListener('blur', () => {
    s.tocados.add(c.id);
    actualizarAviso();
  });
  return h('div', { class: 'campo' },
    h('label', { for: id }, c.etiqueta),
    c.ayuda !== undefined ? h('p', { id: ayudaId, class: 'ayuda-campo' }, c.ayuda) : null,
    control,
    aviso);
}

// ---------------------------------------------------------------------------
// Preguntas
// ---------------------------------------------------------------------------

function ayudaDesplegable(s        , clave        , texto        )              {
  const d = h('details', { class: 'ayuda' }, h('summary', {}, s.t('ayudaResumen')));
  if (s.ayudasAbiertas.has(clave)) d.setAttribute('open', '');
  d.addEventListener('toggle', () => {
    if ((d                      ).open) s.ayudasAbiertas.add(clave);
    else s.ayudasAbiertas.delete(clave);
  });
  d.append(conHtml('p', {}, ayudaHtml(texto)));
  return d;
}

function pregunta(s        , p          )              {
  const multiple = p.tipo === 'multiple';
  const actual = s.estado.respuestas[p.id];
  const marcados = Array.isArray(actual) ? actual : typeof actual === 'string' ? [actual] : [];
  const indicaId = `q_${p.id}_indica`;
  const fs = h('fieldset', { class: 'pregunta', 'aria-describedby': indicaId },
    h('legend', {}, s.tq(p.texto)),
    h('p', { id: indicaId, class: 'indicacion' }, s.t(multiple ? 'indicacionMultiple' : 'indicacionUnica')));
  if (p.ayuda !== undefined) fs.append(ayudaDesplegable(s, p.id, s.tq(p.ayuda)));
  const lista = h('div', { class: 'opciones' });
  for (const o of p.opciones) {
    const id = `q_${p.id}_${o.valor}`;
    const ayudaId = `${id}_ayuda`;
    const input = h('input', {
      type: multiple ? 'checkbox' : 'radio',
      id,
      name: `q_${p.id}`,
      value: o.valor,
      checked: marcados.includes(o.valor),
      'aria-describedby': o.ayuda !== undefined ? ayudaId : null,
    })                    ;
    input.checked = marcados.includes(o.valor);
    input.addEventListener('change', () => {
      s.aplicar(multiple
        ? alternarOpcion(s.estado, s.config, p.id, o.valor, input.checked)
        : responder(s.estado, s.config, p.id, o.valor));
    });
    lista.append(h('div', { class: 'opcion' },
      input,
      h('label', { for: id }, s.tq(o.etiqueta)),
      o.ayuda !== undefined ? conHtml('p', { id: ayudaId, class: 'ayuda-opcion' }, ayudaHtml(s.tq(o.ayuda))) : null));
  }
  fs.append(lista);
  return fs;
}

// ---------------------------------------------------------------------------
// Pantallas
// ---------------------------------------------------------------------------

export function pantallaInicio(s        )              {
  const raiz = h('div', { class: 'pantalla' }, titulo(s.t('tituloInicio')));
  raiz.append(h('p', { class: 'intro' }, s.t('introInicio')));
  raiz.append(h('section', { class: 'privacidad', 'aria-labelledby': 'privacidad-titulo' },
    h('h3', { id: 'privacidad-titulo' }, s.t('privacidadTitulo')),
    h('p', {}, s.t('avisoPrivacidad'))));
  raiz.append(botones(s, false, s.t('comenzar')));
  return raiz;
}

export function pantallaBloque(s        , paso      )              {
  const bloqueId = bloqueDePaso(paso);
  const bloque = s.config.cuestionario.bloques.find((b) => b.id === bloqueId);
  const raiz = h('div', { class: 'pantalla' }, titulo(bloque?.titulo ?? bloqueId));
  // La descripción del bloque solo va en su primera pantalla.
  if (paso === `bloque:${bloqueId}` && bloque?.descripcion !== undefined) raiz.append(h('p', { class: 'intro' }, bloque.descripcion));
  for (const p of preguntasDePaso(s.config, s.resultado, paso)) raiz.append(pregunta(s, p));
  raiz.append(botones(s, true, s.t('siguiente')));
  return raiz;
}
