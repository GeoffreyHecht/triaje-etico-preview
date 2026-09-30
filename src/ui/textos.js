// Texto de la interfaz con `{ajustes.k}` sustituido (05-diseno §4.4; REQ-74). Puro: se prueba en Node.
                                           
import { aTexto, sustituir } from '../motor/marcadores.js';

/** Sustituye los marcadores `{ajustes.k}` de un texto; ningún `{` queda a la vista del IR. */
export function textoConAjustes(texto        , ajustes         )         {
  return aTexto(sustituir(texto, {}, ajustes));
}
