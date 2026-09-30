// Motivos del resultado: decisivos y lista completa (05-diseno §4.3, §7.1; REQ-09).
                                          
import { motivosDecisivos } from '../motor/explicar.js';
import { h } from './dom.js';
                                          

function nombreNivel(s        )         {
  const n = s.config.cuestionario.niveles.find((x) => x.id === s.resultado.nivel);
  return `${s.t('nivelPalabra')} ${s.resultado.nivel}${n ? ` — ${n.nombre}` : ''}`;
}

/** «Nivel 1 — Compromiso». El resultado solo se muestra con el cuestionario completo (REQ-14). */
export function textoNivel(s        )         {
  return nombreNivel(s);
}

function origenDe(s        , m        )         {
  if (m.origen.tipo === 'global') return s.t('motivoGlobal');
  if (m.origen.tipo === 'regla') return s.t('motivoReglaNoAceptada');
  const { pregunta, valor } = m.origen;
  for (const b of s.config.cuestionario.bloques) {
    const p = b.preguntas.find((q) => q.id === pregunta);
    if (p !== undefined) {
      const o = p.opciones.find((x) => x.valor === valor);
      return `${s.tr(p.texto)} — ${s.tr(o?.etiqueta ?? valor)}`;
    }
  }
  return pregunta;
}

/** Texto de la pregunta que originó el motivo ('' si es global). */
export function textoPreguntaDe(s        , m        )         {
  if (m.origen.tipo === 'global') return '';
  // Un motivo de regla no aceptada no tiene pregunta: lleva un encabezado breve (REQ-70).
  if (m.origen.tipo === 'regla') return s.t('motivoReglaNoAceptada');
  const id = m.origen.pregunta;
  for (const b of s.config.cuestionario.bloques) {
    const p = b.preguntas.find((q) => q.id === id);
    if (p !== undefined) return s.tr(p.texto);
  }
  return '';
}

/** Motivos decisivos: la pregunta en tipo menor y, debajo, el motivo. Nivel 0: una frase. */
export function listaDecisivos(s        )              {
  const decisivos = motivosDecisivos(s.resultado);
  if (decisivos.length === 0) return h('p', { class: 'sin-motivos' }, s.t('sinDecisivosNivel0'));
  const ul = h('ul', { class: 'motivos decisivos' });
  for (const m of decisivos) {
    const pregunta = textoPreguntaDe(s, m);
    ul.append(h('li', m.origen.tipo === 'regla' ? { class: 'motivo-regla' } : {},
      pregunta !== '' ? h('span', { class: 'motivo-pregunta' }, pregunta) : null,
      h('span', { class: 'motivo-texto' }, s.tr(m.texto))));
  }
  return ul;
}

function efectosDe(s        , m        )           {
  const { cuestionario, compromisos, documentos } = s.config;
  const partes           = [];
  if (m.nivel !== undefined) partes.push(`${s.t('efectoNivel')} ${m.nivel}`);
  const nombresPaquete = m.paquetes.map((id) => compromisos.paquetes.find((p) => p.id === id)?.nombre ?? id);
  if (nombresPaquete.length > 0) partes.push(`${s.t('efectoPaquetes')}: ${nombresPaquete.join(', ')}`);
  const nombresAnexo = m.anexos.map((id) => documentos.anexos.find((a) => a.id === id)?.nombre ?? id);
  if (nombresAnexo.length > 0) partes.push(`${s.t('efectoAnexos')}: ${nombresAnexo.join(', ')}`);
  const secciones = m.seccionesF04.map((id) => documentos.f04.secciones.find((x) => x.id === id)?.titulo ?? id);
  if (secciones.length > 0) partes.push(`${s.t('efectoSecciones')}: ${secciones.join(', ')}`);
  if (m.alertas.length > 0) partes.push(`${s.t('efectoAlertas')}: ${m.alertas.map((id) => cuestionario.alertas.find((a) => a.id === id)?.texto ?? id).join(' ')}`);
  return partes;
}

/** Motivos como «pregunta → efecto» (lista completa, plegada en el resultado). */
export function listaMotivos(s        )              {
  if (s.resultado.motivos.length === 0) return h('p', { class: 'sin-motivos' }, s.t('sinMotivos'));
  const ul = h('ul', { class: 'motivos' });
  for (const m of s.resultado.motivos) {
    const efectos = efectosDe(s, m);
    ul.append(h('li', {},
      h('span', { class: 'motivo-origen' }, origenDe(s, m)),
      ' ',
      h('span', { class: 'motivo-flecha' }, s.t('motivoFlecha')),
      ' ',
      h('span', { class: 'motivo-texto' }, s.tr(m.texto)),
      efectos.length > 0 ? h('span', { class: 'motivo-efectos' }, efectos.join(' · ')) : null,
    ));
  }
  return ul;
}
