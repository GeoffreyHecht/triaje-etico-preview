// Exportar e importar el borrador (05-diseno §7.2, §8.4; REQ-42 a REQ-47).
import { crearBorrador, descargarBorrador, importarBorrador } from '../borrador.js';
import { aplicarBorrador } from './estado.js';
import { h } from './dom.js';
                                          

/** Botón de exportar con la advertencia obligatoria de 04-documentos §9. */
export function botonExportar(s        )              {
  const aviso = h('p', { id: 'aviso-exportar', class: 'aviso-exportar' }, s.t('avisoExportar'));
  const boton = h('button', { type: 'button', class: 'secundario', 'aria-describedby': 'aviso-exportar' }, s.t('exportarBorrador'));
  boton.addEventListener('click', () => {
    descargarBorrador(crearBorrador(s.estado.datos, s.estado.respuestas, s.config, s.ctx().fecha, s.estado.noAceptadas));
  });
  return h('div', { class: 'exportar' }, aviso, boton);
}

/** Lee el archivo elegido; solo reemplaza el estado con `ok: true` (REQ-45). */
async function importar(s        , archivo      )                {
  const texto = await archivo.text();
  const res = importarBorrador(texto, s.config);
  if (!res.ok) {
    s.avisar({ tipo: 'error', texto: s.t('importacionFallida'), detalles: [`${s.t(`errorBorrador_${res.codigo}`)} ${res.detalle}`.trim()] });
    return;
  }
  s.reemplazar(aplicarBorrador(s.config, res.borrador));
  s.avisar({ tipo: 'info', texto: s.t('borradorImportado') });
  if (res.otraVersion) s.avisar({ tipo: 'info', texto: s.t('borradorOtraVersion') });
  if (res.descartadas.length > 0) s.avisar({ tipo: 'info', texto: s.t('borradorDescartadas'), detalles: res.descartadas });
}

/**
 * Zona «Respuestas guardadas» de la cabecera (05-diseno §7.1): exportar, retomar desde un archivo y borrar,
 * juntas y disponibles en todas las pantallas. `borrar` pide la confirmación y limpia el estado.
 */
export function menuBorrador(s        , borrar            )              {
  const menu = h('details', { class: 'menu-borrador' })                      ;
  const resumen = h('summary', {}, s.t('borradorTitulo'));
  const cerrar = () => { menu.open = false; };

  const entrada = h('input', { type: 'file', id: 'archivo-borrador', accept: '.json,application/json' })                    ;
  entrada.addEventListener('change', () => {
    const archivo = entrada.files?.[0];
    entrada.value = '';
    if (archivo !== undefined) { cerrar(); void importar(s, archivo); }
  });

  const botonBorrar = h('button', { type: 'button', class: 'peligro' }, s.t('borrarDatos'));
  botonBorrar.addEventListener('click', () => { cerrar(); borrar(); });

  menu.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && menu.open) { cerrar(); resumen.focus(); }
  });
  // Un clic fuera del panel lo cierra (la cabecera se arma una sola vez: un único oyente).
  document.addEventListener('click', (ev) => {
    if (menu.open && ev.target instanceof Node && !menu.contains(ev.target)) cerrar();
  });

  menu.append(resumen, h('div', { class: 'panel-borrador' },
    h('p', { class: 'nota' }, s.t('borradorAutoguardado')),
    botonExportar(s),
    h('div', { class: 'importar' },
      h('label', { for: 'archivo-borrador' }, s.t('retomarResumen')),
      entrada),
    botonBorrar));
  return menu;
}
