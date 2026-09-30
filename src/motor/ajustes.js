// Valores efectivos de ajustes para un proyecto (05-diseno §4.4; REQ-74). Puro.
                                                              

/** Ajustes comunes con los parámetros que fijaron las respuestas (p. ej. el plazo de conservación extendido). */
export function ajustesEfectivos(config        , resultado                               )          {
  return { ...config.ajustes, ...(resultado.parametros ?? {}) };
}
