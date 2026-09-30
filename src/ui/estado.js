// Estado de la interfaz sin DOM (05-diseno §7.2). Puro: se prueba en Node (tests/ui.test.ts).
// REQ-13 (exclusividad al marcar), REQ-14 (documentos solo con el cuestionario completo),
// REQ-15 (descarte de respuestas ocultas), REQ-16 (datos finales según el resultado).
                                                                                                       
import { evaluar } from '../motor/evaluar.js';

/**
 * Pantallas: inicio → pantallas de cada bloque → resultado → documentos (05-diseno §7.1).
 * `bloque:B` es la primera pantalla del bloque B; `bloque:B/2`, `bloque:B/3`… las siguientes.
 */
                                                                              

                         
               
                         
                                                                               
                        
             
 

/** Estado nuevo junto con el resultado que le corresponde. */
                          
                 
                       
 

/** Campo que la pantalla de correo pide por su cuenta (05-diseno §7.1, paso 4). */
export const ID_COMENTARIO = 'D-COMENTARIO';

export function estadoInicial()         {
  return { datos: {}, respuestas: {}, noAceptadas: [], paso: 'inicio' };
}

/**
 * Evalúa y deja en el estado solo las respuestas efectivas (REQ-15) y las reglas no aceptadas
 * que siguen activas (REQ-73).
 */
export function calcular(estado        , config        )          {
  const resultado = evaluar(estado.respuestas, config, estado.datos, estado.noAceptadas);
  return { estado: { ...estado, respuestas: resultado.respuestas, noAceptadas: [...resultado.reglasNoAceptadas] }, resultado };
}

/**
 * Reglas que admiten la casilla «No se puede cumplir» (REQ-70): las activas antes de aplicar ninguna
 * declaración (una regla que solo aparece al subir al nivel 2 por otra declaración no se puede declarar).
 * Vacío si el cuestionario está incompleto o el nivel no es 1 ni 2.
 */
export function reglasDeclarables(estado        , config        )           {
  const base = evaluar(estado.respuestas, config, estado.datos, []);
  if (!base.completo || (base.nivel !== '1' && base.nivel !== '2')) return [];
  return base.reglas.map((r) => r.id);
}

/** Marca o desmarca una regla como no aceptada y recalcula (REQ-70, 71). */
export function alternarReglaNoAceptada(estado        , config        , regla        , marcada         )          {
  const resto = estado.noAceptadas.filter((id) => id !== regla);
  const noAceptadas = marcada && reglasDeclarables(estado, config).includes(regla) ? [...resto, regla] : resto;
  return calcular({ ...estado, noAceptadas }, config);
}

function preguntaPorId(config        , id        )                       {
  for (const b of config.cuestionario.bloques) {
    const p = b.preguntas.find((q) => q.id === id);
    if (p !== undefined) return p;
  }
  return undefined;
}

/** Respuesta a una pregunta `sino` o `unica`. */
export function responder(estado        , config        , pregunta        , valor        )          {
  return calcular({ ...estado, respuestas: { ...estado.respuestas, [pregunta]: valor } }, config);
}

/**
 * Marca o desmarca una opción de una `multiple` (REQ-13): marcar una exclusiva deja solo
 * esa opción; marcar una normal quita las exclusivas.
 */
export function alternarOpcion(
  estado        , config        , pregunta        , valor        , marcada         ,
)          {
  const p = preguntaPorId(config, pregunta);
  const previa = estado.respuestas[pregunta];
  const actual = Array.isArray(previa) ? previa : typeof previa === 'string' ? [previa] : [];
  let nueva          ;
  if (!marcada) {
    nueva = actual.filter((v) => v !== valor);
  } else {
    const opcion = p?.opciones.find((o) => o.valor === valor);
    if (opcion?.exclusiva === true) {
      nueva = [valor];
    } else {
      const exclusivas = new Set((p?.opciones ?? []).filter((o) => o.exclusiva === true).map((o) => o.valor));
      nueva = [...actual.filter((v) => !exclusivas.has(v) && v !== valor), valor];
    }
  }
  const respuestas             = { ...estado.respuestas };
  if (nueva.length === 0) delete respuestas[pregunta];
  else respuestas[pregunta] = nueva;
  return calcular({ ...estado, respuestas }, config);
}

/** Cambia un campo D-*; nunca altera el nivel (REQ-16). */
export function cambiarDato(estado        , config        , id        , valor        )          {
  return calcular({ ...estado, datos: { ...estado.datos, [id]: valor } }, config);
}

/** Reemplaza datos y respuestas (importación o restauración de un borrador) y vuelve al inicio. */
export function aplicarBorrador(config        , borrador                                                        )          {
  return calcular({
    datos: { ...borrador.datos },
    respuestas: { ...borrador.respuestas },
    noAceptadas: [...(borrador.noAceptadas ?? [])],
    paso: 'inicio',
  }, config);
}

// ---------------------------------------------------------------------------
// Pasos y pantallas
// ---------------------------------------------------------------------------

export function camposInicio(config        )              {
  return config.cuestionario.datos.filter((c) => c.etapa === 'inicio');
}

/**
 * Campos de la pantalla de documentos (REQ-16): los de `etapa: inicio` y luego los de `resultado.datos`,
 * sin el comentario del correo (que va en el paso del correo) y sin repetidos.
 */
export function camposDocumentos(config        , resultado           )              {
  const campos              = [...camposInicio(config)];
  for (const id of resultado.datos) {
    if (id === ID_COMENTARIO || campos.some((c) => c.id === id)) continue;
    const c = config.cuestionario.datos.find((x) => x.id === id);
    if (c !== undefined) campos.push(c);
  }
  return campos;
}

/** Una pantalla del cuestionario: su paso y las preguntas que le corresponden (visibles o no). */
                                 
             
                 
                        
 

/** Pantallas de un bloque: una pregunta con `pantallaNueva` abre otra pantalla (05-diseno §7.1). */
export function pantallasDeBloque(config        , bloque        )                   {
  const b = config.cuestionario.bloques.find((x) => x.id === bloque);
  const grupos               = [];
  for (const p of b?.preguntas ?? []) {
    if (grupos.length === 0 || p.pantallaNueva === true) grupos.push([]);
    grupos[grupos.length - 1].push(p);
  }
  return grupos.map((preguntas, i)                 => ({
    paso: i === 0 ? `bloque:${bloque}` : `bloque:${bloque}/${i + 1}`,
    bloque,
    preguntas,
  }));
}

function pantallaDePaso(config        , paso      )                             {
  if (!paso.startsWith('bloque:')) return undefined;
  const bloque = paso.slice('bloque:'.length).split('/')[0];
  return pantallasDeBloque(config, bloque).find((x) => x.paso === paso);
}

/** Bloque al que pertenece un paso `bloque:B` o `bloque:B/n`. */
export function bloqueDePaso(paso      )         {
  return paso.slice('bloque:'.length).split('/')[0];
}

/** Preguntas visibles de una pantalla del cuestionario, en orden. */
export function preguntasDePaso(config        , resultado           , paso      )             {
  const visibles = new Set(resultado.visibles);
  return (pantallaDePaso(config, paso)?.preguntas ?? []).filter((p) => visibles.has(p.id));
}

/** Preguntas visibles de un bloque (todas sus pantallas), en orden. */
export function preguntasVisibles(config        , resultado           , bloque        )             {
  const visibles = new Set(resultado.visibles);
  const b = config.cuestionario.bloques.find((x) => x.id === bloque);
  return (b?.preguntas ?? []).filter((p) => visibles.has(p.id));
}

function pasosCanonicos(config        )         {
  return [
    'inicio',
    ...config.cuestionario.bloques.flatMap((b) => pantallasDeBloque(config, b.id).map((x) => x.paso)),
    'resultado',
    'documentos',
  ];
}

/** Pantallas por las que se puede pasar: sin las pantallas del cuestionario sin preguntas visibles. */
export function pasosDisponibles(config        , resultado           )         {
  return pasosCanonicos(config).filter((paso) => {
    if (paso.startsWith('bloque:')) return preguntasDePaso(config, resultado, paso).length > 0;
    return true;
  });
}

/** Pantalla siguiente (o la más cercana posterior si la actual dejó de existir). */
export function pasoSiguiente(config        , resultado           , paso      )       {
  const disp = pasosDisponibles(config, resultado);
  const i = disp.indexOf(paso);
  if (i >= 0) return disp[Math.min(i + 1, disp.length - 1)];
  const canon = pasosCanonicos(config);
  const pos = canon.indexOf(paso);
  return disp.find((d) => canon.indexOf(d) > pos) ?? 'resultado';
}

/** Pantalla anterior (o la más cercana previa si la actual dejó de existir). */
export function pasoAnterior(config        , resultado           , paso      )       {
  const disp = pasosDisponibles(config, resultado);
  const i = disp.indexOf(paso);
  if (i >= 0) return disp[Math.max(i - 1, 0)];
  const canon = pasosCanonicos(config);
  const pos = canon.indexOf(paso);
  return [...disp].reverse().find((d) => canon.indexOf(d) < pos) ?? 'inicio';
}

/** Va a una pantalla; si no está disponible, a la más cercana posterior. */
export function irA(estado        , config        , resultado           , paso      )         {
  if (pasosDisponibles(config, resultado).includes(paso)) return { ...estado, paso };
  return { ...estado, paso: pasoSiguiente(config, resultado, paso) };
}

export function avanzar(estado        , config        , resultado           )         {
  return { ...estado, paso: pasoSiguiente(config, resultado, estado.paso) };
}

export function retroceder(estado        , config        , resultado           )         {
  return { ...estado, paso: pasoAnterior(config, resultado, estado.paso) };
}

/** Pantalla del bloque que contiene una pregunta (para saltar a una pendiente). */
export function pasoDePregunta(config        , pregunta        )       {
  for (const b of config.cuestionario.bloques) {
    const pantalla = pantallasDeBloque(config, b.id).find((x) => x.preguntas.some((p) => p.id === pregunta));
    if (pantalla !== undefined) return pantalla.paso;
  }
  return 'inicio';
}

/** REQ-14: los documentos se habilitan solo con el cuestionario completo. */
export function documentosHabilitados(resultado           )          {
  return resultado.completo;
}

/**
 * Datos que pueden llegar a los documentos: los de inicio y los pedidos por el resultado (REQ-16).
 * Un campo que dejó de pedirse (p. ej. D-ORG-EXTERNA tras cambiar P-PER-07 a «no») se conserva
 * en el estado y en el borrador, pero no se imprime ni sustituye marcadores.
 */
export function datosVigentes(config        , resultado           , datos       )        {
  const pedidos = new Set([...camposInicio(config).map((c) => c.id), ...resultado.datos]);
  const vigentes        = {};
  for (const [id, v] of Object.entries(datos)) if (pedidos.has(id)) vigentes[id] = v;
  return vigentes;
}

/** Campos con `requerido` sin valor (pantalla de documentos): solo advertencia, nunca bloquean (REQ-16). */
export function datosFaltantes(config        , resultado           , datos       )              {
  return camposDocumentos(config, resultado).filter((c) => c.requerido === true && (datos[c.id] ?? '').trim() === '');
}

/** Fecha local AAAA-MM-DD (la interfaz inyecta `new Date()`; aquí no se lee el reloj). */
export function fechaLocal(d      )         {
  const dos = (n        ) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
