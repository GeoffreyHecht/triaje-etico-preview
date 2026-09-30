// Evaluación de condiciones (05-diseno §3). Pura: sin DOM, E/S ni azar (REQ-10).
                                                                

/** Respuesta de una pregunta como conjunto de valores; oculta o sin responder = ∅. */
function conjunto(ctx                   , p        )              {
  const r = ctx.respuestas[p];
  if (r === undefined) return new Set();
  return new Set(Array.isArray(r) ? r : [r]);
}

export function evaluarCondicion(c           , ctx                   )          {
  if ('p' in c) {
    const r = conjunto(ctx, c.p);
    if ('incluye' in c) return r.has(c.incluye);
    if ('incluyeAlguno' in c) return c.incluyeAlguno.some((v) => r.has(v));
    if ('es' in c) {
      const esperado = new Set(Array.isArray(c.es) ? c.es : [c.es]);
      return r.size === esperado.size && [...r].every((v) => esperado.has(v));
    }
    if ('algunaSalvo' in c) return [...r].some((v) => !c.algunaSalvo.includes(v));
    // Inalcanzable según el tipo; protege contra YAML no validado.
    throw new Error(`Condición sobre ${(c                 ).p} sin operador reconocido`);
  }
  if ('cond' in c) {
    const valor = ctx.condiciones[c.cond];
    if (valor === undefined) throw new Error(`Condición derivada ${c.cond} no calculada en el contexto`);
    return valor;
  }
  if ('nivel' in c) {
    if (ctx.nivel === undefined) throw new Error('El contexto no tiene nivel (operando de fase 2)');
    return c.nivel.includes(ctx.nivel);
  }
  if ('paquete' in c) {
    if (ctx.paquetes === undefined) throw new Error('El contexto no tiene paquetes (operando de fase 2)');
    return ctx.paquetes.includes(c.paquete);
  }
  if ('dato' in c) {
    return (ctx.datos[c.dato] ?? '').trim() !== '';
  }
  if ('regla' in c) {
    if (ctx.reglas === undefined) throw new Error('El contexto no tiene reglas (operando de fase 3)');
    return ctx.reglas.includes(c.regla);
  }
  if ('todas' in c) return c.todas.every((x) => evaluarCondicion(x, ctx));
  if ('alguna' in c) return c.alguna.some((x) => evaluarCondicion(x, ctx));
  if ('no' in c) return !evaluarCondicion(c.no, ctx);
  throw new Error('Condición desconocida');
}
