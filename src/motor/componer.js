// Composición de reglas y secciones del F04 (05-diseno §5.2–§5.3; REQ-11, 28, 31, 37, 38). Pura.
             
                                                                                           
                                   
                     
import { evaluarCondicion } from './condiciones.js';
import { sustituir } from './marcadores.js';
import { ajustesEfectivos } from './ajustes.js';

/** Respuestas-tipo vigentes de una regla activa: las de la variante elegida o las estándar. */
function respuestasDeRegla(ctx                , id        )                  {
  const activa = ctx.resultado.reglas.find((r) => r.id === id);
  const regla = ctx.config.compromisos.paquetes.flatMap((p) => p.reglas).find((r) => r.id === id);
  if (activa === undefined || regla === undefined) return [];
  const variante = activa.variante === undefined
    ? undefined
    : regla.variantes?.find((v) => v.clave === activa.variante);
  return variante?.respuestas ?? regla.respuestas;
}

/** Quita las marcas `[verificar…]`, notas internas de validación que no se muestran (05-diseno §5.2). */
export function sinMarcasVerificar(texto        )         {
  return texto
    .replace(/\s*\[verificar[^\]]*\]/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/ ([.,;:)])/g, '$1')
    .trim();
}

export function componerReglas(ctx                )                   {
  const { config, resultado, datos } = ctx;
  const ajustes = ajustesEfectivos(config, resultado);
  const salida                   = [];
  for (const activa of resultado.reglas) {
    const regla = config.compromisos.paquetes.flatMap((p) => p.reglas).find((r) => r.id === activa.id);
    if (regla === undefined) continue;
    const variante = activa.variante === undefined
      ? undefined
      : regla.variantes?.find((v) => v.clave === activa.variante);
    salida.push({
      id: regla.id,
      paquete: activa.paquete,
      titulo: regla.titulo,
      compromiso: sustituir(variante?.compromiso ?? regla.compromiso, datos, ajustes),
      fundamento: sinMarcasVerificar(variante?.fundamento ?? regla.fundamento),
    });
  }
  return salida;
}

function componerItem(item         , ctx                , cc                   , exclusiones         )                {
  const { config, datos } = ctx;
  const ajustes = ajustesEfectivos(config, ctx.resultado);
  const base = { enunciado: item.enunciado };

  if (item.id === undefined) {
    if (item.plantilla !== undefined) {
      return { ...base, estado: 'prellenado', respuesta: sustituir(item.plantilla, datos, ajustes), reglas: [], exclusiones: [] };
    }
    if (item.listaAnexos === true) {
      return { ...base, estado: 'prellenado', respuesta: [], reglas: [], exclusiones: [], listaAnexos: true };
    }
    return { ...base, estado: 'completar', respuesta: [], reglas: [], exclusiones: [] };
  }

  const textos           = [];
  const reglas           = [];
  const excl                                      = [];
  const pistas           = [];
  if (item.pista !== undefined) pistas.push(item.pista);

  for (const activa of ctx.resultado.reglas) {
    for (const f of respuestasDeRegla(ctx, activa.id)) {
      if (f.item !== item.id) continue;
      if (f.si !== undefined && !evaluarCondicion(f.si, cc)) continue;
      if (exclusiones && activa.noAceptada === true) {
        // Regla que el IR declara que no puede cumplir (REQ-72): no se prellena ninguno de sus fragmentos.
        excl.push({ regla: activa.id, motivo: config.compromisos.noAceptada.motivoExclusion });
        continue;
      }
      if (exclusiones && f.excluirSi !== undefined && evaluarCondicion(f.excluirSi, cc)) {
        excl.push({ regla: activa.id, motivo: f.motivoExclusion ?? '' });
        continue;
      }
      textos.push(f.texto);
      if (!reglas.includes(activa.id)) reglas.push(activa.id);
      if (f.pista !== undefined) pistas.push(f.pista);
    }
  }

  const pista = pistas.length > 0 ? pistas.join(' ') : undefined;
  const conId = { ...base, id: item.id };
  const conPista = (o               )                => (pista === undefined ? o : { ...o, pista });

  if (textos.length > 0) {
    const respuesta                 = sustituir(textos.join(' '), datos, ajustes);
    return conPista({ ...conId, estado: excl.length > 0 ? 'parcial' : 'prellenado', respuesta, reglas, exclusiones: excl });
  }
  if (excl.length > 0) {
    const motivos = [...new Set(excl.map((e) => e.motivo))].join('; ');
    const aviso = `${config.documentos.textos['DOC-F04'].noPrellenado} ${motivos}${/[.!?…]$/.test(motivos) ? '' : '.'}`;
    return {
      ...conId, estado: 'completar', respuesta: [], reglas: [], exclusiones: excl,
      pista: item.pista === undefined ? aviso : `${aviso} ${item.pista}`,
    };
  }
  const na = item.noAplica;
  if (na !== undefined && (na.si === undefined || evaluarCondicion(na.si, cc))) {
    const t = sustituir(na.texto, datos, ajustes);
    if (na.sugerencia === true) {
      return conPista({ ...conId, estado: 'sugerencia', respuesta: [], reglas: [], exclusiones: [], sugerencia: t });
    }
    return conPista({ ...conId, estado: 'noAplica', respuesta: t, reglas: [], exclusiones: [] });
  }
  return conPista({ ...conId, estado: 'completar', respuesta: [], reglas: [], exclusiones: [] });
}

export function componerSecciones(
  ids          ,
  ctx                ,
  opciones                          ,
)                     {
  const { resultado, datos, config } = ctx;
  const cc                    = {
    respuestas: resultado.respuestas,
    condiciones: resultado.condiciones,
    datos,
    nivel: resultado.nivel,
    paquetes: resultado.paquetes,
    reglas: resultado.reglas.map((r) => r.id),
  };
  return config.documentos.f04.secciones
    .filter((s) => ids.includes(s.id))
    .map((s) => {
      const sec                   = {
        id: s.id,
        titulo: s.titulo,
        items: s.items.map((it) => componerItem(it, ctx, cc, opciones.exclusiones)),
      };
      if (s.instruccion !== undefined) sec.instruccion = s.instruccion;
      return sec;
    });
}
