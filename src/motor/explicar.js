// Motivos decisivos (05-diseno §4.3; REQ-09, REQ-24). Puro: sin DOM ni E/S.
                                                     

/** Motivos de preguntas o reglas no aceptadas cuyo efecto fija el nivel final, en el orden de `resultado.motivos`. Nivel 0 → []. */
export function motivosDecisivos(resultado           )           {
  if (resultado.nivel === '0') return [];
  return resultado.motivos.filter((m) => (m.origen.tipo === 'pregunta' || m.origen.tipo === 'regla') && m.nivel === resultado.nivel);
}
