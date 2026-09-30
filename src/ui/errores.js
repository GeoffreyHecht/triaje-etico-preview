// Pantalla de error de configuración (REQ-51, REQ-56): archivo, ruta, ID y mensaje; no corre el cuestionario.
                                               
import { textosErrorCarga } from '../cargar.js';
import { h } from './dom.js';

export function pantallaErrores(errores               )              {
  const lista = h('ol', { class: 'errores-config' });
  for (const e of errores) {
    const detalle = h('dl', {},
      h('dt', {}, textosErrorCarga.archivo), h('dd', {}, `config/${e.archivo}.yaml`),
      e.ruta !== '' ? h('dt', {}, textosErrorCarga.ruta) : null, e.ruta !== '' ? h('dd', {}, e.ruta) : null,
      e.id !== undefined ? h('dt', {}, textosErrorCarga.id) : null, e.id !== undefined ? h('dd', {}, e.id) : null,
      h('dt', {}, textosErrorCarga.mensaje), h('dd', {}, e.mensaje));
    lista.append(h('li', {}, detalle));
  }
  return h('main', { id: 'contenido', class: 'error-carga', role: 'alert' },
    h('h1', {}, textosErrorCarga.titulo),
    h('p', {}, textosErrorCarga.explicacion),
    lista);
}
