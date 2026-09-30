// Motor de triaje (05-diseno §4). Puro: sin DOM, E/S, fecha ni azar (REQ-10).
             
                                                                                                  
                     
import { evaluarCondicion } from './condiciones.js';

function preguntasEnOrden(config        )             {
  return config.cuestionario.bloques.flatMap((b) => b.preguntas);
}

/** Normaliza la respuesta cruda de una pregunta; undefined = sin respuesta válida. */
function normalizarUna(p          , cruda                               )                                {
  if (cruda === undefined || cruda === null) return undefined;
  const validos = new Set(p.opciones.map((o) => o.valor));
  const lista = (Array.isArray(cruda) ? cruda : [cruda]).filter((v) => typeof v === 'string' && validos.has(v));
  if (p.tipo !== 'multiple') {
    if (Array.isArray(cruda)) return cruda.length === 1 && lista.length === 1 ? lista[0] : undefined;
    return lista[0];
  }
  // Sin duplicados, en el orden de las opciones.
  let sel = p.opciones.map((o) => o.valor).filter((v) => lista.includes(v));
  if (sel.length > 1) {
    const quitar = new Set(p.opciones.filter((o) => o.exclusiva && o.valor !== 'nose').map((o) => o.valor));
    sel = sel.filter((v) => !quitar.has(v));
  }
  return sel;
}

/** Normalización del paso 1 (REQ-13): ignora preguntas y valores desconocidos; no filtra por visibilidad. */
export function normalizarRespuestas(respuestas            , config        )             {
  const salida             = {};
  for (const p of preguntasEnOrden(config)) {
    const r = normalizarUna(p, respuestas[p.id]);
    if (r !== undefined) salida[p.id] = r;
  }
  return salida;
}

function calcularCondiciones(config        , respuestas            , datos       )                          {
  const condiciones                          = {};
  for (const d of config.cuestionario.condiciones) {
    condiciones[d.id] = evaluarCondicion(d.si, { respuestas, condiciones, datos });
  }
  return condiciones;
}

function unicos(lista          )           {
  return [...new Set(lista)];
}

function enOrden(elegidos                  , orden          )           {
  const s = new Set(elegidos);
  return orden.filter((x) => s.has(x));
}

export function evaluar(respuestas            , config        , datos        = {}, noAceptadas           = [])            {
  const cuest = config.cuestionario;
  const normalizadas = normalizarRespuestas(respuestas, config);

  // Paso 2: visibilidad, en orden, con el mapa de respuestas efectivas.
  const efectivas             = {};
  const visibles           = [];
  const pendientes           = [];
  const preguntasVisibles             = [];
  for (const p of preguntasEnOrden(config)) {
    if (p.mostrarSi) {
      const ctx                    = { respuestas: efectivas, condiciones: calcularCondiciones(config, efectivas, datos), datos };
      if (!evaluarCondicion(p.mostrarSi, ctx)) continue;
    }
    visibles.push(p.id);
    preguntasVisibles.push(p);
    const r = normalizadas[p.id];
    if (r === undefined || (Array.isArray(r) && r.length === 0)) {
      pendientes.push(p.id);
      continue;
    }
    efectivas[p.id] = r;
    const elegidos = Array.isArray(r) ? r : [r];
    if (p.opciones.some((o) => o.terminaCuestionario && elegidos.includes(o.valor))) break;
  }

  // Paso 3: condiciones derivadas finales.
  const condiciones = calcularCondiciones(config, efectivas, datos);
  const ctx1                    = { respuestas: efectivas, condiciones, datos };

  // Paso 4: efectos de respuestas.
  const motivos           = [];
  const niveles            = [];
  const paquetes           = [];
  const anexos           = [];
  const alertas           = [];
  const parametros                         = {};
  for (const p of preguntasVisibles) {
    const r = efectivas[p.id];
    if (r === undefined) continue;
    const elegidos = Array.isArray(r) ? r : [r];
    for (const o of p.opciones) {
      if (!elegidos.includes(o.valor)) continue;
      const e = o.efectos.find((x) => x.si === undefined || evaluarCondicion(x.si, ctx1));
      if (!e) continue;
      if (e.nivel) niveles.push(e.nivel);
      for (const [clave, fuente] of Object.entries(e.parametros ?? {})) {
        const v = (config.ajustes                                      )[fuente];
        if (typeof v === 'number') parametros[clave] = v;   // paso 7 ter
      }
      paquetes.push(...(e.paquetes ?? []));
      anexos.push(...(e.anexos ?? []));
      alertas.push(...(e.alertas ?? []));
      motivos.push({
        origen: { tipo: 'pregunta', pregunta: p.id, valor: o.valor },
        texto: e.motivo,
        ...(e.nivel ? { nivel: e.nivel } : {}),
        paquetes: [...(e.paquetes ?? [])],
        anexos: [...(e.anexos ?? [])],
        alertas: [...(e.alertas ?? [])],
        seccionesF04: [],
      });
    }
  }

  // Paso 5: nivel (A prevalece; si no, el máximo numérico; sin efectos, '0').
  let nivel          = '0';
  if (niveles.includes('A')) nivel = 'A';
  else {
    const nums = niveles.map(Number);
    if (nums.length > 0) nivel = String(Math.max(...nums))           ;
  }

  // Pasos 6 y 7 como función del nivel: se repiten si una regla no aceptada sube el nivel (paso 7 bis).
  const fase2 = (nivelFase         ) => {
    const pq = [...paquetes];
    const an = [...anexos];
    const al = [...alertas];
    const sec           = [];
    const motivosGlobales           = [];
    // Paso 6: efectos globales, en orden, con contexto de fase 2.
    cuest.efectosGlobales.forEach((g, indice) => {
      const ctx2                    = { respuestas: efectivas, condiciones, datos, nivel: nivelFase, paquetes: unicos(pq) };
      if (!evaluarCondicion(g.si, ctx2)) return;
      pq.push(...(g.paquetes ?? []));
      an.push(...(g.anexos ?? []));
      al.push(...(g.alertas ?? []));
      sec.push(...(g.seccionesF04 ?? []));
      motivosGlobales.push({
        origen: { tipo: 'global', indice },
        texto: g.motivo,
        paquetes: [...(g.paquetes ?? [])],
        anexos: [...(g.anexos ?? [])],
        alertas: [...(g.alertas ?? [])],
        seccionesF04: [...(g.seccionesF04 ?? [])],
      });
    });
    const paquetesFinal = enOrden(pq, config.compromisos.paquetes.map((x) => x.id));
    const ctxFinal                    = { respuestas: efectivas, condiciones, datos, nivel: nivelFase, paquetes: paquetesFinal };
    // Paso 7: reglas activas.
    const reglas                = [];
    for (const paq of config.compromisos.paquetes) {
      if (!paquetesFinal.includes(paq.id)) continue;
      for (const r of paq.reglas) {
        if (r.aplicaCuando && !evaluarCondicion(r.aplicaCuando, ctxFinal)) continue;
        const v = (r.variantes ?? []).find((x) => evaluarCondicion(x.si, ctxFinal));
        reglas.push({ id: r.id, paquete: paq.id, ...(v ? { variante: v.clave } : {}) });
      }
    }
    return { an, al, sec, motivosGlobales, paquetesFinal, ctxFinal, reglas };
  };

  let f2 = fase2(nivel);

  // Paso 7 bis: reglas no aceptadas (una sola pasada; el nivel solo sube).
  const pedidas = new Set(noAceptadas);
  const reglasNoAceptadas = f2.reglas.map((r) => r.id).filter((id) => pedidas.has(id));
  if (reglasNoAceptadas.length > 0 && nivel !== '2') {
    nivel = '2';
    f2 = fase2(nivel);
  }
  const motivosRegla           = [];
  for (const id of reglasNoAceptadas) {
    const regla = config.compromisos.paquetes.flatMap((x) => x.reglas).find((x) => x.id === id);
    motivosRegla.push({
      origen: { tipo: 'regla', regla: id },
      texto: `${config.compromisos.noAceptada.motivo} «${regla?.titulo ?? id}» (${id})`,
      nivel: '2',
      paquetes: [],
      anexos: [],
      alertas: [],
      seccionesF04: [],
    });
  }
  const reglas = f2.reglas.map((r) => (reglasNoAceptadas.includes(r.id) ? { ...r, noAceptada: true } : r));
  const { paquetesFinal, ctxFinal } = f2;

  // Paso 8: documentos y datos (etapa final).
  const defNivel = cuest.niveles.find((n) => n.id === nivel);
  const documentos = unicos(
    (defNivel?.documentos ?? []).filter((d) => d.si === undefined || evaluarCondicion(d.si, ctxFinal)).map((d) => d.doc),
  );
  const datosPedidos = cuest.datos
    .filter((d) => d.etapa === 'final' && (d.pedirSi === undefined || evaluarCondicion(d.pedirSi, ctxFinal)))
    .map((d) => d.id);

  // Paso 9: orden determinista, sin duplicados.
  return {
    nivel,
    completo: pendientes.length === 0,
    visibles,
    pendientes,
    respuestas: efectivas,
    condiciones,
    paquetes: paquetesFinal,
    reglas,
    anexos: enOrden(f2.an, config.documentos.anexos.map((a) => a.id)),
    seccionesF04: enOrden(f2.sec, config.documentos.f04.secciones.map((s) => s.id)),
    alertas: enOrden(f2.al, cuest.alertas.map((a) => a.id)),
    motivos: [...motivos, ...f2.motivosGlobales, ...motivosRegla],
    documentos,
    datos: datosPedidos,
    reglasNoAceptadas,
    parametros,
  };
}
