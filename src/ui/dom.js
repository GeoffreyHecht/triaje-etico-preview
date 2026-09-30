// Ayudas mínimas para construir DOM sin innerHTML con texto dinámico (REQ-40: nada externo).
                                                            
                                                                            

export function h(etiqueta        , atributos            = {}, ...hijos        )              {
  const e = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === undefined || v === null || v === false) continue;
    e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of hijos) {
    if (c !== null && c !== undefined && c !== false) e.append(c);
  }
  return e;
}

/** Elemento con HTML ya escapado (ayudas con énfasis y textos compuestos). */
export function conHtml(etiqueta        , atributos           , html        )              {
  const e = h(etiqueta, atributos);
  e.innerHTML = html;
  return e;
}

export function vaciar(nodo      )       {
  while (nodo.firstChild !== null) nodo.removeChild(nodo.firstChild);
}
