// Borrador local y exportable (05-diseno §8.4, 04-documentos §9; REQ-42 a REQ-45, REQ-47).
             
                                                                          
                    

const CLAVE_LOCAL = 'triaje-etico-mt/borrador';

function contestada(v                               )                         {
  if (v === undefined) return false;
  return Array.isArray(v) ? v.length > 0 : v.trim() !== '';
}

/** Solo D-* no vacíos y respuestas contestadas (REQ-44). Puro. */
export function crearBorrador(
  datos       , respuestas            , config        , fecha        , noAceptadas           = [],
)           {
  const d        = {};
  for (const campo of config.cuestionario.datos) {
    const v = datos[campo.id];
    if (typeof v === 'string' && v.trim() !== '') d[campo.id] = v;
  }
  const r             = {};
  for (const bloque of config.cuestionario.bloques) {
    for (const p of bloque.preguntas) {
      const v = respuestas[p.id];
      if (contestada(v)) r[p.id] = Array.isArray(v) ? [...v] : v;
    }
  }
  const b           = { versionConfig: config.ajustes.version, fecha, datos: d, respuestas: r };
  if (noAceptadas.length > 0) b.noAceptadas = [...noAceptadas];
  return b;
}

/** JSON con sangría. Puro. */
export function serializarBorrador(b          )         {
  return JSON.stringify(b, null, 2);
}

function esObjeto(x         )                               {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function rechazo(codigo                                                        , detalle        )                       {
  return { ok: false, codigo, detalle };
}

/** Valida un borrador importado (REQ-45, REQ-47). Puro; nunca lanza. */
export function importarBorrador(texto        , config        )                       {
  let crudo         ;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return rechazo('json_invalido', 'El archivo no es JSON válido.');
  }

  // Forma de Borrador.
  if (!esObjeto(crudo) || typeof crudo.versionConfig !== 'string' || typeof crudo.fecha !== 'string'
    || !esObjeto(crudo.datos) || !esObjeto(crudo.respuestas)) {
    return rechazo('forma_invalida', 'Faltan versionConfig, fecha, datos o respuestas, o tienen otro tipo.');
  }
  if (crudo.noAceptadas !== undefined
    && !(Array.isArray(crudo.noAceptadas) && crudo.noAceptadas.every((x) => typeof x === 'string'))) {
    return rechazo('forma_invalida', 'noAceptadas debe ser una lista de textos.');
  }
  const noAceptadasCrudas           = (crudo.noAceptadas                        ) ?? [];
  const datosCrudos = crudo.datos;
  const respCrudas = crudo.respuestas;
  for (const [k, v] of Object.entries(datosCrudos)) {
    if (typeof v !== 'string') return rechazo('forma_invalida', `datos.${k} debe ser texto.`);
  }
  for (const [k, v] of Object.entries(respCrudas)) {
    const ok = typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string'));
    if (!ok) return rechazo('forma_invalida', `respuestas.${k} debe ser texto o lista de textos.`);
  }

  const preguntas = new Map(config.cuestionario.bloques.flatMap((b) => b.preguntas).map((p) => [p.id, p]));
  const idsDatos = new Set(config.cuestionario.datos.map((c) => c.id));

  // Combinación de una opción exclusiva con otras: siempre se rechaza.
  for (const [id, v] of Object.entries(respCrudas)) {
    const p = preguntas.get(id);
    if (p === undefined || p.tipo !== 'multiple' || !Array.isArray(v)) continue;
    const exclusiva = p.opciones.find((o) => o.exclusiva === true && v.includes(o.valor));
    if (exclusiva !== undefined && new Set(v).size > 1) {
      return rechazo('combinacion_exclusiva', `${id}: «${exclusiva.valor}» no se puede combinar con otras opciones.`);
    }
  }

  const otraVersion = crudo.versionConfig !== config.ajustes.version;
  const descartadas           = [];
  const respuestas             = {};
  for (const [id, v] of Object.entries(respCrudas)                                 ) {
    const p = preguntas.get(id);
    if (p === undefined) {
      if (!otraVersion) return rechazo('pregunta_desconocida', id);
      descartadas.push(id);
      continue;
    }
    const valores = new Set(p.opciones.map((o) => o.valor));
    const forma = p.tipo === 'multiple' ? Array.isArray(v) : typeof v === 'string';
    if (!forma) {
      if (!otraVersion) return rechazo('valor_desconocido', `${id}: la forma de la respuesta no corresponde al tipo de pregunta.`);
      descartadas.push(id);
      continue;
    }
    const lista = Array.isArray(v) ? v : [v];
    const validos           = [];
    for (const val of lista) {
      if (valores.has(val)) {
        validos.push(val);
      } else if (!otraVersion) {
        return rechazo('valor_desconocido', `${id} = ${val}`);
      } else {
        descartadas.push(`${id} = ${val}`);
      }
    }
    if (validos.length > 0) respuestas[id] = Array.isArray(v) ? validos : validos[0];
  }

  const datos        = {};
  for (const [id, v] of Object.entries(datosCrudos)                      ) {
    if (idsDatos.has(id)) {
      datos[id] = v;
    } else if (!otraVersion) {
      return rechazo('dato_desconocido', id);
    } else {
      descartadas.push(id);
    }
  }

  const idsReglas = new Set(config.compromisos.paquetes.flatMap((p) => p.reglas.map((r) => r.id)));
  const noAceptadas           = [];
  for (const id of noAceptadasCrudas) {
    if (idsReglas.has(id)) {
      if (!noAceptadas.includes(id)) noAceptadas.push(id);
    } else if (!otraVersion) {
      return rechazo('regla_desconocida', id);
    } else {
      descartadas.push(id);
    }
  }

  const borrador           = { versionConfig: crudo.versionConfig, fecha: crudo.fecha, datos, respuestas };
  if (noAceptadas.length > 0) borrador.noAceptadas = noAceptadas;
  return {
    ok: true,
    borrador,
    otraVersion,
    descartadas,
  };
}

/** `window.localStorage` o `null` si no está disponible (REQ-42). Nunca lanza. */
export function almacenNavegador()                      {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Guarda en la clave `triaje-etico-mt/borrador`; `false` si falla o no hay almacén. Nunca lanza. */
export function guardarLocal(almacen                     , b          )          {
  if (almacen === null) return false;
  try {
    almacen.setItem(CLAVE_LOCAL, serializarBorrador(b));
    return true;
  } catch {
    return false;
  }
}

/** Lee y valida el borrador local; `null` si no hay, falla o no hay almacén. Nunca lanza. */
export function leerLocal(almacen                     , config        )                              {
  if (almacen === null) return null;
  try {
    const texto = almacen.getItem(CLAVE_LOCAL);
    if (texto === null || texto === undefined) return null;
    return importarBorrador(texto, config);
  } catch {
    return null;
  }
}

/** Borra el borrador local (REQ-43); `false` si falla o no hay almacén. Nunca lanza. */
export function borrarLocal(almacen                     )          {
  if (almacen === null) return false;
  try {
    almacen.removeItem(CLAVE_LOCAL);
    return true;
  } catch {
    return false;
  }
}

/** Descarga `borrador-mt-<fecha>.json`. */
export function descargarBorrador(b          )       {
  const blob = new Blob([serializarBorrador(b)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = b.fecha.replace(/[^0-9A-Za-z-]+/g, '') || 'sin-fecha';
  a.href = url;
  a.download = `borrador-mt-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
