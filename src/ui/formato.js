// Formato de textos de ayuda, sin DOM (05-diseno §2, §7.1). Puro.
import { escaparHtml } from '../motor/marcadores.js';

/** Escapa el HTML y después convierte `**…**` en <strong> y `*…*` en <em>. */
export function ayudaHtml(texto        )         {
  return escaparHtml(texto)
    .replace(/\*\*(.+?)\*\*(?!\*)/g, '<strong>$1</strong>')
    .replace(/\*([^*\s][^*]*?)\*/g, '<em>$1</em>');
}

/** Reglas agrupadas por paquete, en el orden de los paquetes; omite los paquetes sin reglas. */
export function agruparReglasPorPaquete                               (
  reglas     ,
  paquetes                                  ,
)                                                             {
  const grupos                                                             = [];
  for (const paquete of paquetes) {
    const deEste = reglas.filter((r) => r.paquete === paquete.id);
    if (deEste.length > 0) grupos.push({ paquete, reglas: deEste });
  }
  return grupos;
}
