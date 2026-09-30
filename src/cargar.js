// Carga de config/*.yaml (05-diseno §1; REQ-51, REQ-56). Único módulo con `fetch`.
// Sus mensajes y los rótulos de la pantalla de error viven aquí porque deben funcionar
// aunque interfaz.yaml esté roto o no se haya podido descargar.
                                                                                  
import { ARCHIVOS_CONFIG, parsearConfig } from './motor/parsear.js';
import { validarConfig } from './motor/validarConfig.js';

export const textosErrorCarga = {
  titulo: 'No se pudo cargar la configuración',
  explicacion: 'El cuestionario no se ejecutará hasta que se corrijan los archivos de configuración de la carpeta config/. Esta es la lista de problemas:',
  archivo: 'Archivo',
  ruta: 'Ruta',
  id: 'ID',
  mensaje: 'Problema',
};

function describirFallo(archivo               , causa         )              {
  const detalle = causa instanceof Error ? causa.message : String(causa);
  return { archivo, ruta: '', mensaje: `no se pudo descargar config/${archivo}.yaml: ${detalle}` };
}

/** Descarga los cinco YAML, los interpreta y los valida. Nunca lanza: los fallos vuelven como `ErrorConfig`. */
export async function cargarConfig()                               {
  const textos                                         = {};
  const fallos                = [];
  await Promise.all(ARCHIVOS_CONFIG.map(async (archivo) => {
    try {
      const respuesta = await fetch(new URL(`../config/${archivo}.yaml`, import.meta.url));
      if (!respuesta.ok) {
        fallos.push(describirFallo(archivo, new Error(`respuesta HTTP ${respuesta.status}`)));
        return;
      }
      textos[archivo] = await respuesta.text();
    } catch (e) {
      fallos.push(describirFallo(archivo, e));
    }
  }));
  const fallidos = new Set(fallos.map((f) => f.archivo));
  const { crudo, errores } = parsearConfig(textos);
  const todos = [...fallos, ...errores.filter((e) => !fallidos.has(e.archivo))];
  if (todos.length > 0) {
    todos.sort((a, b) => ARCHIVOS_CONFIG.indexOf(a.archivo) - ARCHIVOS_CONFIG.indexOf(b.archivo));
    return { ok: false, errores: todos };
  }
  return validarConfig(crudo);
}
