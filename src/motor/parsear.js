// Lectura de config/*.yaml (REQ-51, REQ-56). Puro: recibe los textos, no lee archivos.
import { load } from '../../vendor/js-yaml.mjs';
                                                                           

export const ARCHIVOS_CONFIG                  = ['cuestionario', 'compromisos', 'documentos', 'ajustes', 'interfaz'];

export function parsearConfig(textos                                        )                                                 {
  const crudo              = {};
  const errores                = [];
  for (const archivo of ARCHIVOS_CONFIG) {
    const texto = textos[archivo];
    if (texto === undefined) {
      errores.push({ archivo, ruta: '', mensaje: `falta el archivo config/${archivo}.yaml` });
      continue;
    }
    try {
      crudo[archivo] = load(texto);
    } catch (e) {
      const err = e                                                                                  ;
      const motivo = err.reason ?? err.message ?? 'error desconocido';
      const lugar = err.mark ? ` (línea ${err.mark.line + 1}, columna ${err.mark.column + 1})` : '';
      errores.push({ archivo, ruta: '', mensaje: `YAML inválido en config/${archivo}.yaml${lugar}: ${motivo}` });
    }
  }
  return { crudo, errores };
}
