// Marcadores {D-X} y {ajustes.k} (05-diseno §5.1, REQ-37). Puro: sin DOM ni E/S.
                                                                  

const MARCADOR = /\{(D-[A-Z0-9-]+|ajustes\.[A-Za-z0-9]+)\}/g;

/** Agrega texto al final de la lista, fusionando con la parte de texto anterior. */
function agregarTexto(partes                , texto        )       {
  if (texto === '') return;
  const ultima = partes[partes.length - 1];
  if (ultima !== undefined && ultima.tipo === 'texto') ultima.texto += texto;
  else partes.push({ tipo: 'texto', texto });
}

export function sustituir(texto        , datos       , ajustes         )                 {
  const partes                 = [];
  let pos = 0;
  for (const m of texto.matchAll(MARCADOR)) {
    const clave = m[1];
    agregarTexto(partes, texto.slice(pos, m.index));
    pos = m.index + m[0].length;
    const finMarcador = pos;
    let valor                    ;
    if (clave.startsWith('ajustes.')) {
      const v = (ajustes                                      )[clave.slice('ajustes.'.length)];
      valor = v === undefined || v === null ? undefined : String(v);
    } else {
      valor = datos[clave];
    }
    if (valor === undefined || valor.trim() === '') partes.push({ tipo: 'completar', clave });
    else {
      agregarTexto(partes, valor);
      // Puntuación (05 §5.1): si el valor ya termina en puntuación final, se omite el "." de la plantilla.
      if (/[.!?…]$/.test(valor) && texto[finMarcador] === '.' && texto[finMarcador + 1] !== '.') pos = finMarcador + 1;
    }
  }
  agregarTexto(partes, texto.slice(pos));
  return partes;
}

export function aTexto(t                )         {
  return t.map((p) => (p.tipo === 'texto' ? p.texto : '[completar]')).join('');
}

export function escaparHtml(s        )         {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function aHtml(t                )         {
  return t
    .map((p) => (p.tipo === 'texto' ? escaparHtml(p.texto) : '<mark class="completar">[completar]</mark>'))
    .join('');
}
