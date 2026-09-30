// Validador de la configuración (REQ-01, 50, 51, 52, 54, 55, 57, 58; 05-diseno §2.6).
// Puro: sin fs ni DOM. Acumula TODOS los errores; cada uno con archivo, ruta, ID (si hay) y mensaje en español.
             
                                                                       
                     

                                   
                      

const ARCHIVOS                  = ['cuestionario', 'compromisos', 'documentos', 'ajustes', 'interfaz'];
const NIVELES = ['A', '0', '1', '2'];
const TIPOS_PREGUNTA = ['sino', 'unica', 'multiple'];
const TIPOS_DATO = ['texto', 'parrafo', 'fecha', 'correo'];
const ETAPAS_DATO = ['inicio', 'final'];
const FORMATOS_DOC = ['pdf', 'doc', 'mailto', 'json'];
const OPERADORES_P = ['incluye', 'incluyeAlguno', 'es', 'algunaSalvo'];
const OPERADORES_OTROS = ['cond', 'nivel', 'paquete', 'dato', 'regla', 'todas', 'alguna', 'no'];
const CLAVES_URL = ['urlModeloCI', 'urlCartaCompromiso', 'urlFormularioBioseguridad'];
/** Plazos en meses (enteros positivos). */
const CLAVES_PLAZO = ['conservacionMeses', 'conservacionRespaldoMeses', 'conservacionExtendidaMeses'];
/** Parámetros que una respuesta puede fijar para el proyecto (ids.md §10, «ajustable por respuesta»; REQ-74). */
export const CLAVES_AJUSTABLES = ['conservacionMeses'];
const FUENTES_FUNDAMENTO = /Ley 21\.719|CIOMS|UdeC|Recomendaciones CEBB-FI|DS /;

/** Las claves de ids.md §10. */
export const CLAVES_AJUSTES = [
  'version', 'correoCebb', 'conservacionMeses', 'conservacionRespaldoMeses', 'conservacionExtendidaMeses', 'redaccionNivel1',
  'fechaVigencia21719', 'viaDerechos', 'contactoIncidentes', 'almacenamientoInstitucional',
  'urlModeloCI', 'urlCartaCompromiso', 'urlFormularioBioseguridad', 'logo',
];

/** Claves obligatorias de documentos.textos (05-diseno §6). */
export const TEXTOS_OBLIGATORIOS                           = {
  comun: ['encabezado', 'comite', 'nivel', 'propuesta', 'borrador', 'pieVersion', 'pieGenerado', 'piePagina', 'paginaDe', 'etiquetaTitulo', 'etiquetaIr',
    'etiquetaUnidad', 'etiquetaCorreoIr', 'etiquetaEstudiante', 'etiquetaCarrera', 'motivosTitulo', 'anexosTitulo',
    'prellenado', 'firmaIr', 'firmaEstudiante', 'fecha'],
  'DOC-CARTA-ADS': ['titulo', 'destinatario', 'asunto', 'itemTitulo', 'itemEstudiante', 'itemProyecto', 'respaldo',
    'itemCertificado', 'certificado', 'declaracion', 'nota', 'avisoVencida'],
  'DOC-CONSTANCIA': ['titulo', 'resultado', 'respuestasTitulo', 'alertasTitulo', 'recomendacion', 'nota'],
  'DOC-COMPROMISO': ['titulo_registro', 'titulo_solicitud_abreviada', 'descripcionTitulo', 'etiquetaObjetivo', 'etiquetaResumen',
    'etiquetaFechaInicio', 'etiquetaOrganizacion', 'etiquetaFuenteDatos', 'reglasTitulo', 'fundamentoEtiqueta', 'generalesTitulo',
    'generalCambios', 'inicio_registro', 'inicio_solicitud_abreviada', 'firmasTitulo',
    'fundamentosTitulo', 'fundamentosIntro', 'fundamentosRegla'],
  'DOC-CI': ['notaIrTitulo', 'notaMixta', 'aceptar', 'noAceptar'],
  'DOC-PGD': ['titulo', 'introduccion', 'responsableTitulo', 'conservacion', 'viaDerechos'],
  'DOC-F04': ['titulo', 'motivosTitulo', 'motivosAviso', 'noPrellenado', 'omitidoParcial', 'omitidoPorque', 'completarPista', 'sugerenciaEtiqueta',
    'etiquetaNombre', 'etiquetaFirma', 'etiquetaFecha'],
  'DOC-CORREO': ['asunto_A', 'asunto_1_registro', 'asunto_1_solicitud_abreviada', 'asunto_2', 'saludo', 'cuerpo_A',
    'cuerpo_1_registro', 'cuerpo_1_solicitud_abreviada', 'cuerpo_2', 'paquetesTitulo', 'motivosTitulo', 'comentarioTitulo',
    'adjuntosTitulo', 'justificarAnexos', 'completadoPdf', 'cierre'],
};

// Formatos de ID (ids.md). Se escriben como expresiones para que el código no contenga IDs concretos (REQ-50).
const RE_PREGUNTA = /^P-[A-Z]{3}-\d\d$/;
const RE_PAQUETE = /^RP-[A-Z]+$/;
const RE_REGLA = /^(RP-[A-Z]+)\.(\d+)$/;
const RE_ANEXO = /^ANX-[A-Z0-9]+(-[A-Z0-9]+)*$/;
const RE_DOC = /^DOC-[A-Z0-9]+(-[A-Z0-9]+)*$/;
const RE_ALERTA = /^ALR-[A-Z0-9]+(-[A-Z0-9]+)*$/;
const RE_SECCION = /^F04-(I|JUST|DECL|II-[123]|III|IV)$/;
const RE_ITEM = /^F04-([0-9]+\.[0-9]+|II-3|III)$/;
const RE_DATO = /^D-[A-Z0-9]+(-[A-Z0-9]+)*$/;
const RE_CONDICION = /^[A-Z][A-Z0-9_]*$/;
const RE_SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esObj(v         )           {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);
}
function esTexto(v         )              {
  return typeof v === 'string' && v.trim() !== '';
}
function sub(ruta        , k                 )         {
  if (typeof k === 'number') return `${ruta}[${k}]`;
  return ruta ? `${ruta}.${k}` : k;
}
function describir(v         )         {
  if (v instanceof Date) return 'una fecha';
  if (v === null || v === undefined) return 'vacío';
  if (Array.isArray(v)) return 'una lista';
  if (typeof v === 'object') return 'un objeto';
  return `${typeof v === 'number' ? 'el número' : typeof v === 'boolean' ? 'el valor' : 'el texto'} «${String(v)}»`;
}

                    
               
                       
                
 

/** Contexto de una condición: dónde está, a qué ID pertenece y qué fase le corresponde (05-diseno §3.2). */
                   
                         
                                                                         
              
             
                                                                                                    
 

export function validarConfig(crudo             )                      {
  const errores                = [];
  const e = (archivo               , ruta        , mensaje        , id         )       => {
    errores.push(id === undefined ? { archivo, ruta, mensaje } : { archivo, ruta, id, mensaje });
  };

  // ---- Espacios de IDs (se llenan en la pasada 1) ----
  const preguntas = new Map                  ();
  const condiciones = new Map                 ();      // id → Condicion cruda
  const condicionesOrden = new Map                ();
  const datos = new Set        ();
  const alertas = new Set        ();
  const paquetes = new Set        ();
  const reglas = new Set        ();
  const anexos = new Set        ();
  const documentos = new Set        ();
  const secciones = new Set        ();
  const itemsF04 = new Set        ();

  const raiz                                      = {};
  for (const archivo of ARCHIVOS) {
    const v = crudo[archivo];
    if (v === undefined) e(archivo, '', `falta el archivo config/${archivo}.yaml`);
    else if (!esObj(v)) e(archivo, '', `config/${archivo}.yaml debe ser un conjunto de campos (clave: valor), no ${describir(v)}`);
    else raiz[archivo] = v;
  }
  const cuest = raiz.cuestionario;
  const comp = raiz.compromisos;
  const docs = raiz.documentos;
  const ajus = raiz.ajustes;
  const inter = raiz.interfaz;

  // ---- Utilidades de validación ----
  const registrar = (
    espacio             , valor         , formato        , archivo               , ruta        , que        , ejemplo        ,
  )                     => {
    if (!esTexto(valor)) {
      e(archivo, ruta, `falta el identificador (id) de ${que}`);
      return undefined;
    }
    if (!formato.test(valor)) e(archivo, ruta, `el identificador «${valor}» de ${que} no tiene el formato correcto (formato: ${ejemplo})`, valor);
    if (espacio.has(valor)) e(archivo, ruta, `el identificador «${valor}» de ${que} está repetido`, valor);
    espacio.add(valor);
    return valor;
  };

  const lista = (
    v         , archivo               , ruta        , nombre        , noVacia         , id         ,
  )                   => {
    if (!Array.isArray(v)) {
      e(archivo, ruta, `«${nombre}» debe ser una lista, pero es ${describir(v)}`, id);
      return null;
    }
    if (noVacia && v.length === 0) {
      e(archivo, ruta, `«${nombre}» no puede estar vacía`, id);
      return null;
    }
    return v;
  };

  const texto = (o     , campo        , archivo               , ruta        , id         )                     => {
    const v = o[campo];
    if (!esTexto(v)) {
      e(archivo, sub(ruta, campo), v === undefined ? `falta el campo «${campo}»` : `el campo «${campo}» debe ser un texto no vacío, pero es ${describir(v)}`, id);
      return undefined;
    }
    return v;
  };

  const textoOpcional = (o     , campo        , archivo               , ruta        , id         )       => {
    if (o[campo] !== undefined && !esTexto(o[campo])) {
      e(archivo, sub(ruta, campo), `el campo «${campo}», si se escribe, debe ser un texto no vacío, pero es ${describir(o[campo])}`, id);
    }
  };

  const booleanoOpcional = (o     , campo        , archivo               , ruta        , id         )       => {
    if (o[campo] !== undefined && typeof o[campo] !== 'boolean') {
      e(archivo, sub(ruta, campo), `el campo «${campo}» debe ser verdadero o falso (true/false), pero es ${describir(o[campo])}`, id);
    }
  };

  const enumerado = (o     , campo        , valores          , archivo               , ruta        , id         )       => {
    const v = o[campo];
    if (typeof v !== 'string' || !valores.includes(v)) {
      e(archivo, sub(ruta, campo), v === undefined ? `falta el campo «${campo}»` : `el campo «${campo}» debe ser uno de: ${valores.join(', ')}; se encontró ${describir(v)}`, id);
    }
  };

  const camposPermitidos = (o     , permitidos          , archivo               , ruta        , id         )       => {
    for (const k of Object.keys(o)) {
      if (!permitidos.includes(k)) e(archivo, sub(ruta, k), `el campo «${k}» no existe en este lugar (campos permitidos: ${permitidos.join(', ')})`, id);
    }
  };

  const fundamentoValido = (o     , archivo               , ruta        , id                    , obligatorio         )       => {
    const v = o.fundamento;
    if (v === undefined && !obligatorio) return;
    const t = texto(o, 'fundamento', archivo, ruta, id);
    if (t !== undefined && !FUENTES_FUNDAMENTO.test(t)) {
      e(archivo, sub(ruta, 'fundamento'), 'el fundamento debe citar al menos una fuente (Ley 21.719, CIOMS, UdeC, Recomendaciones CEBB-FI o DS)', id);
    }
  };

  /** Comprueba que cada elemento de una lista de IDs exista en su espacio. */
  const referencias = (
    v         , espacio             , conocido         , que        ,
    archivo               , ruta        , campo        , donde        , id         ,
  )       => {
    if (v === undefined) return;
    const l = lista(v, archivo, sub(ruta, campo), campo, false, id);
    if (!l) return;
    l.forEach((x, i) => {
      if (typeof x !== 'string') e(archivo, sub(sub(ruta, campo), i), `se esperaba el identificador de ${que}, pero hay ${describir(x)}`, id);
      else if (conocido && !espacio.has(x)) e(archivo, sub(sub(ruta, campo), i), `${que} ${x} no existe (citado en ${donde})`, id ?? x);
    });
  };

  // ---- Recolección de preguntas citadas (orden) ----
  const preguntasCitadas = (c         , salida                                 , via                    , vistas             )       => {
    if (!esObj(c)) return;
    if (typeof c.p === 'string') salida.set(c.p, via);
    if (typeof c.cond === 'string' && !vistas.has(c.cond)) {
      vistas.add(c.cond);
      preguntasCitadas(condiciones.get(c.cond), salida, via ?? c.cond, vistas);
    }
    if (Array.isArray(c.todas)) c.todas.forEach((x) => preguntasCitadas(x, salida, via, vistas));
    if (Array.isArray(c.alguna)) c.alguna.forEach((x) => preguntasCitadas(x, salida, via, vistas));
    if (c.no !== undefined) preguntasCitadas(c.no, salida, via, vistas);
  };

  // ---- Recorrido de condiciones ----
  const validarCond = (c         , ruta        , k         )       => {
    const { archivo, donde, id } = k;
    if (!esObj(c)) {
      e(archivo, ruta, `la condición de ${donde} debe ser un objeto con un operador (p, cond, todas, alguna, no, nivel, paquete, dato o regla), pero es ${describir(c)}`, id);
      return;
    }
    const claves = Object.keys(c);
    let operador                    ;
    if ('p' in c) {
      const otras = claves.filter((x) => x !== 'p');
      if (otras.length !== 1 || !OPERADORES_P.includes(otras[0])) {
        e(archivo, ruta, `una condición sobre una pregunta necesita «p» y exactamente uno de: ${OPERADORES_P.join(', ')} (en ${donde}; tiene: ${claves.join(', ')})`, id);
      } else operador = otras[0];
      const p = c.p;
      const pregunta = typeof p === 'string' ? preguntas.get(p) : undefined;
      if (typeof p !== 'string') e(archivo, sub(ruta, 'p'), `«p» debe ser el identificador de una pregunta (en ${donde})`, id);
      else if (!pregunta) {
        if (cuest) e(archivo, sub(ruta, 'p'), `la pregunta ${p} no existe (citada en ${donde})`, id ?? p);
      } else if (operador) {
        const v = c[operador];
        const valores            = Array.isArray(v) ? v : [v];
        if (operador === 'incluye' || (operador === 'es' && !Array.isArray(v))) {
          if (typeof v !== 'string') e(archivo, sub(ruta, operador), `«${operador}» debe ser un valor de la pregunta ${p}, pero es ${describir(v)}`, id ?? p);
        } else {
          if (!Array.isArray(v) || v.length === 0) e(archivo, sub(ruta, operador), `«${operador}» debe ser una lista no vacía de valores de la pregunta ${p}`, id ?? p);
        }
        valores.forEach((x, i) => {
          if (typeof x === 'string' && !pregunta.valores.has(x)) {
            const r = Array.isArray(v) ? sub(sub(ruta, operador          ), i) : sub(ruta, operador          );
            e(archivo, r, `el valor «${x}» no existe en la pregunta ${p} (citado en ${donde})`, id ?? p);
          }
        });
      }
      return;
    }
    if (claves.length !== 1 || !OPERADORES_OTROS.includes(claves[0])) {
      e(archivo, ruta, `una condición debe tener exactamente un operador (p, cond, todas, alguna, no, nivel, paquete, dato o regla) en ${donde}; tiene: ${claves.length ? claves.join(', ') : 'nada'}`, id);
      return;
    }
    operador = claves[0];
    const v = c[operador];
    const rutaOp = sub(ruta, operador);
    switch (operador) {
      case 'cond':
        if (typeof v !== 'string') e(archivo, rutaOp, `«cond» debe ser el nombre de una condición derivada (en ${donde})`, id);
        else if (!condiciones.has(v)) {
          if (cuest) e(archivo, rutaOp, `la condición derivada ${v} no existe (citada en ${donde})`, id ?? v);
        } else if (k.previas && !k.previas.has(v)) {
          e(archivo, rutaOp, `la condición derivada ${v} está definida después de ${id ?? donde}; una condición solo puede citar condiciones anteriores`, id ?? v);
        }
        break;
      case 'nivel':
        if (k.fase < 2) e(archivo, rutaOp, `el operador «nivel» no se puede usar en ${donde}: allí solo se conocen las respuestas, no el nivel final`, id);
        if (!Array.isArray(v) || v.length === 0) e(archivo, rutaOp, `«nivel» debe ser una lista no vacía de niveles (${NIVELES.join(', ')}), escritos entre comillas`, id);
        else v.forEach((n, i) => {
          if (typeof n !== 'string' || !NIVELES.includes(n)) e(archivo, sub(rutaOp, i), `el nivel ${describir(n)} no es válido en ${donde}; los niveles son ${NIVELES.join(', ')} (escríbalos entre comillas)`, id);
        });
        break;
      case 'paquete':
        if (k.fase < 2) e(archivo, rutaOp, `el operador «paquete» no se puede usar en ${donde}: allí solo se conocen las respuestas`, id);
        if (typeof v !== 'string') e(archivo, rutaOp, `«paquete» debe ser el identificador de un paquete (en ${donde})`, id);
        else if (comp && !paquetes.has(v)) e(archivo, rutaOp, `el paquete ${v} no existe (citado en ${donde})`, id ?? v);
        break;
      case 'dato':
        if (k.fase < 2) e(archivo, rutaOp, `el operador «dato» no se puede usar en ${donde}: allí solo se conocen las respuestas`, id);
        if (typeof v !== 'string') e(archivo, rutaOp, `«dato» debe ser el identificador de un campo de datos (en ${donde})`, id);
        else if (cuest && !datos.has(v)) e(archivo, rutaOp, `el campo de datos ${v} no existe (citado en ${donde})`, id ?? v);
        break;
      case 'regla':
        if (k.fase < 3) e(archivo, rutaOp, `el operador «regla» no se puede usar en ${donde}: solo vale en condiciones de documentos (respuestas-tipo, «no aplica», consentimiento informado)`, id);
        if (typeof v !== 'string') e(archivo, rutaOp, `«regla» debe ser el identificador de una regla (en ${donde})`, id);
        else if (comp && !reglas.has(v)) e(archivo, rutaOp, `la regla ${v} no existe (citada en ${donde})`, id ?? v);
        break;
      case 'todas':
      case 'alguna':
        if (!Array.isArray(v) || v.length === 0) e(archivo, rutaOp, `«${operador}» debe ser una lista no vacía de condiciones (en ${donde})`, id);
        else v.forEach((x, i) => validarCond(x, sub(rutaOp, i), k));
        break;
      case 'no':
        validarCond(v, rutaOp, k);
        break;
    }
  };

  // =========================================================================
  // Pasada 1: índices de IDs (formato y duplicados)
  // =========================================================================
  if (cuest) {
    if (Array.isArray(cuest.bloques)) {
      let orden = 0;
      cuest.bloques.forEach((b, i) => {
        if (!esObj(b) || !Array.isArray(b.preguntas)) return;
        b.preguntas.forEach((p, j) => {
          if (!esObj(p)) return;
          const ruta = `bloques[${i}].preguntas[${j}]`;
          const id = registrar(new Set(), p.id, RE_PREGUNTA, 'cuestionario', sub(ruta, 'id'), 'la pregunta', '"P-", tres letras mayúsculas, "-" y dos dígitos');
          if (id === undefined) return;
          if (preguntas.has(id)) {
            e('cuestionario', sub(ruta, 'id'), `el identificador «${id}» de la pregunta está repetido`, id);
            return;
          }
          const valores = new Set        ();
          if (Array.isArray(p.opciones)) p.opciones.forEach((o) => { if (esObj(o) && typeof o.valor === 'string') valores.add(o.valor); });
          preguntas.set(id, { tipo: String(p.tipo), valores, orden: orden++ });
        });
      });
    }
    if (Array.isArray(cuest.condiciones)) {
      cuest.condiciones.forEach((c, i) => {
        if (!esObj(c)) return;
        const ruta = `condiciones[${i}]`;
        const id = registrar(new Set(), c.id, RE_CONDICION, 'cuestionario', sub(ruta, 'id'), 'la condición derivada', 'HAY_PERS');
        if (id === undefined) return;
        if (condiciones.has(id)) e('cuestionario', sub(ruta, 'id'), `el identificador «${id}» de la condición derivada está repetido`, id);
        else { condiciones.set(id, c.si); condicionesOrden.set(id, i); }
      });
    }
    if (Array.isArray(cuest.datos)) {
      cuest.datos.forEach((d, i) => { if (esObj(d)) registrar(datos, d.id, RE_DATO, 'cuestionario', `datos[${i}].id`, 'el campo de datos', 'D-TITULO'); });
    }
    if (Array.isArray(cuest.alertas)) {
      cuest.alertas.forEach((a, i) => { if (esObj(a)) registrar(alertas, a.id, RE_ALERTA, 'cuestionario', `alertas[${i}].id`, 'la alerta', 'ALR-NOSE'); });
    }
  }
  if (comp && Array.isArray(comp.paquetes)) {
    comp.paquetes.forEach((p, i) => {
      if (!esObj(p)) return;
      const rutaP = `paquetes[${i}]`;
      const idP = registrar(paquetes, p.id, RE_PAQUETE, 'compromisos', sub(rutaP, 'id'), 'el paquete de reglas', '"RP-" seguido de letras mayúsculas');
      if (!Array.isArray(p.reglas)) return;
      p.reglas.forEach((r, j) => {
        if (!esObj(r)) return;
        const rutaR = `${rutaP}.reglas[${j}]`;
        const idR = registrar(reglas, r.id, RE_REGLA, 'compromisos', sub(rutaR, 'id'), 'la regla', 'el ID del paquete, un punto y un número');
        const m = typeof idR === 'string' ? RE_REGLA.exec(idR) : null;
        if (idR && m && idP && m[1] !== idP) {
          e('compromisos', sub(rutaR, 'id'), `la regla ${idR} está en el paquete ${idP}, pero su prefijo debe ser ${idP}`, idR);
        }
      });
    });
  }
  if (docs) {
    if (Array.isArray(docs.anexos)) docs.anexos.forEach((a, i) => { if (esObj(a)) registrar(anexos, a.id, RE_ANEXO, 'documentos', `anexos[${i}].id`, 'el anexo', 'ANX-CI'); });
    if (Array.isArray(docs.documentos)) docs.documentos.forEach((d, i) => { if (esObj(d)) registrar(documentos, d.id, RE_DOC, 'documentos', `documentos[${i}].id`, 'el documento', 'DOC-CI'); });
    if (esObj(docs.f04) && Array.isArray(docs.f04.secciones)) {
      docs.f04.secciones.forEach((s, i) => {
        if (!esObj(s)) return;
        registrar(secciones, s.id, RE_SECCION, 'documentos', `f04.secciones[${i}].id`, 'la sección del formulario', 'F04-IV');
        if (!Array.isArray(s.items)) return;
        s.items.forEach((it, j) => {
          if (esObj(it) && it.id !== undefined) registrar(itemsF04, it.id, RE_ITEM, 'documentos', `f04.secciones[${i}].items[${j}].id`, 'el ítem del formulario', 'F04-1.6');
        });
      });
    }
  }

  // =========================================================================
  // Pasada 2: cuestionario.yaml
  // =========================================================================
  const validarEfectoBase = (ef     , ruta        , donde        , id                    )       => {
    referencias(ef.paquetes, paquetes, !!comp, 'el paquete', 'cuestionario', ruta, 'paquetes', donde, id);
    referencias(ef.anexos, anexos, !!docs, 'el anexo', 'cuestionario', ruta, 'anexos', donde, id);
    referencias(ef.alertas, alertas, !!cuest, 'la alerta', 'cuestionario', ruta, 'alertas', donde, id);
    texto(ef, 'motivo', 'cuestionario', ruta, id);
  };

  if (cuest) {
    camposPermitidos(cuest, ['niveles', 'datos', 'bloques', 'condiciones', 'efectosGlobales', 'alertas'], 'cuestionario', '');

    // Niveles (punto 7)
    const niveles = lista(cuest.niveles, 'cuestionario', 'niveles', 'niveles', true);
    if (niveles) {
      const vistos = new Set        ();
      niveles.forEach((n, i) => {
        const ruta = `niveles[${i}]`;
        if (!esObj(n)) { e('cuestionario', ruta, 'cada nivel debe ser un conjunto de campos'); return; }
        const id = n.id;
        if (typeof id !== 'string' || !NIVELES.includes(id)) {
          e('cuestionario', sub(ruta, 'id'), `el nivel ${describir(id)} no es válido; los niveles son ${NIVELES.join(', ')} (escritos entre comillas)`);
        } else {
          if (vistos.has(id)) e('cuestionario', sub(ruta, 'id'), `el nivel ${id} está repetido`, id);
          vistos.add(id);
        }
        const idn = typeof id === 'string' ? id : undefined;
        camposPermitidos(n, ['id', 'nombre', 'resumen', 'documentos'], 'cuestionario', ruta, idn);
        texto(n, 'nombre', 'cuestionario', ruta, idn);
        texto(n, 'resumen', 'cuestionario', ruta, idn);
        const dl = lista(n.documentos, 'cuestionario', sub(ruta, 'documentos'), 'documentos', false, idn);
        dl?.forEach((d, j) => {
          const rd = `${ruta}.documentos[${j}]`;
          if (!esObj(d)) { e('cuestionario', rd, 'cada documento del nivel debe ser un conjunto de campos (doc, si)', idn); return; }
          camposPermitidos(d, ['doc', 'si'], 'cuestionario', rd, idn);
          if (typeof d.doc !== 'string') e('cuestionario', sub(rd, 'doc'), 'falta el identificador del documento (doc)', idn);
          else if (docs && !documentos.has(d.doc)) e('cuestionario', sub(rd, 'doc'), `el documento ${d.doc} no existe (citado en el nivel ${idn ?? '?'})`, idn ?? d.doc);
          if (d.si !== undefined) validarCond(d.si, sub(rd, 'si'), { archivo: 'cuestionario', donde: `«si» del documento ${String(d.doc)} en el nivel ${idn ?? '?'}`, id: idn, fase: 2 });
        });
      });
      for (const n of NIVELES) if (!vistos.has(n)) e('cuestionario', 'niveles', `falta el nivel ${n}: deben estar exactamente ${NIVELES.join(', ')}`, n);
    }

    // Datos
    const dl = lista(cuest.datos, 'cuestionario', 'datos', 'datos', true);
    dl?.forEach((d, i) => {
      const ruta = `datos[${i}]`;
      if (!esObj(d)) { e('cuestionario', ruta, 'cada campo de datos debe ser un conjunto de campos'); return; }
      const id = typeof d.id === 'string' ? d.id : undefined;
      camposPermitidos(d, ['id', 'etiqueta', 'ayuda', 'tipo', 'etapa', 'pedirSi', 'requerido'], 'cuestionario', ruta, id);
      texto(d, 'etiqueta', 'cuestionario', ruta, id);
      textoOpcional(d, 'ayuda', 'cuestionario', ruta, id);
      enumerado(d, 'tipo', TIPOS_DATO, 'cuestionario', ruta, id);
      enumerado(d, 'etapa', ETAPAS_DATO, 'cuestionario', ruta, id);
      booleanoOpcional(d, 'requerido', 'cuestionario', ruta, id);
      if (d.pedirSi !== undefined) validarCond(d.pedirSi, sub(ruta, 'pedirSi'), { archivo: 'cuestionario', donde: `pedirSi del dato ${id ?? '?'}`, id, fase: 2 });
    });

    // Bloques y preguntas
    const bloques = lista(cuest.bloques, 'cuestionario', 'bloques', 'bloques', true);
    const bloquesVistos = new Set        ();
    const parametroFijadoPor = new Map                ();   // parámetro → pregunta que lo fija (§2.6.14)
    bloques?.forEach((b, i) => {
      const rutaB = `bloques[${i}]`;
      if (!esObj(b)) { e('cuestionario', rutaB, 'cada bloque debe ser un conjunto de campos'); return; }
      const idB = typeof b.id === 'string' ? b.id : undefined;
      camposPermitidos(b, ['id', 'titulo', 'descripcion', 'preguntas'], 'cuestionario', rutaB, idB);
      if (!esTexto(b.id)) e('cuestionario', sub(rutaB, 'id'), 'falta el identificador (id) del bloque');
      else {
        if (bloquesVistos.has(b.id)) e('cuestionario', sub(rutaB, 'id'), `el identificador «${b.id}» del bloque está repetido`, b.id);
        bloquesVistos.add(b.id);
      }
      texto(b, 'titulo', 'cuestionario', rutaB, idB);
      textoOpcional(b, 'descripcion', 'cuestionario', rutaB, idB);
      const pl = lista(b.preguntas, 'cuestionario', sub(rutaB, 'preguntas'), 'preguntas', true, idB);
      pl?.forEach((p, j) => {
        const ruta = `${rutaB}.preguntas[${j}]`;
        if (!esObj(p)) { e('cuestionario', ruta, 'cada pregunta debe ser un conjunto de campos'); return; }
        const id = typeof p.id === 'string' ? p.id : undefined;
        camposPermitidos(p, ['id', 'tipo', 'texto', 'ayuda', 'mostrarSi', 'pantallaNueva', 'opciones'], 'cuestionario', ruta, id);
        enumerado(p, 'tipo', TIPOS_PREGUNTA, 'cuestionario', ruta, id);
        texto(p, 'texto', 'cuestionario', ruta, id);
        textoOpcional(p, 'ayuda', 'cuestionario', ruta, id);
        booleanoOpcional(p, 'pantallaNueva', 'cuestionario', ruta, id);
        if (p.pantallaNueva === true && j === 0) {
          e('cuestionario', sub(ruta, 'pantallaNueva'), `«pantallaNueva» no se permite en la primera pregunta de un bloque (${id ?? '?'}): el bloque ya empieza en una pantalla nueva`, id);
        }
        const tipo = typeof p.tipo === 'string' ? p.tipo : '';

        if (p.mostrarSi !== undefined) {
          const rutaM = sub(ruta, 'mostrarSi');
          validarCond(p.mostrarSi, rutaM, { archivo: 'cuestionario', donde: `mostrarSi de ${id ?? '?'}`, id, fase: 1 });
          // Punto 4: solo preguntas anteriores (directamente o por condiciones derivadas).
          const propia = id ? preguntas.get(id) : undefined;
          if (propia) {
            const citadas = new Map                            ();
            preguntasCitadas(p.mostrarSi, citadas, undefined, new Set());
            for (const [q, via] of citadas) {
              const pq = preguntas.get(q);
              if (pq && pq.orden >= propia.orden) {
                e('cuestionario', rutaM, `mostrarSi de ${id} cita la pregunta ${q}${via ? ` (a través de la condición ${via})` : ''}, que no está antes; solo puede citar preguntas anteriores`, id);
              }
            }
          }
        }

        const ol = lista(p.opciones, 'cuestionario', sub(ruta, 'opciones'), 'opciones', true, id);
        if (!ol) return;
        const valoresVistos = new Set        ();
        ol.forEach((o, k) => {
          const rutaO = `${ruta}.opciones[${k}]`;
          if (!esObj(o)) { e('cuestionario', rutaO, 'cada opción debe ser un conjunto de campos', id); return; }
          const valor = typeof o.valor === 'string' ? o.valor : undefined;
          camposPermitidos(o, ['valor', 'etiqueta', 'ayuda', 'exclusiva', 'terminaCuestionario', 'efectos'], 'cuestionario', rutaO, id);
          if (valor === undefined) e('cuestionario', sub(rutaO, 'valor'), `falta el valor de la opción en la pregunta ${id ?? '?'}`, id);
          else {
            if (!RE_SNAKE.test(valor)) e('cuestionario', sub(rutaO, 'valor'), `el valor «${valor}» de la pregunta ${id ?? '?'} debe estar en minúsculas con guion bajo (snake_case)`, id);
            if (valoresVistos.has(valor)) e('cuestionario', sub(rutaO, 'valor'), `el valor «${valor}» está repetido en la pregunta ${id ?? '?'}`, id);
            valoresVistos.add(valor);
          }
          texto(o, 'etiqueta', 'cuestionario', rutaO, id);
          textoOpcional(o, 'ayuda', 'cuestionario', rutaO, id);
          booleanoOpcional(o, 'exclusiva', 'cuestionario', rutaO, id);
          booleanoOpcional(o, 'terminaCuestionario', 'cuestionario', rutaO, id);
          if (o.exclusiva === true && tipo !== 'multiple') {
            e('cuestionario', sub(rutaO, 'exclusiva'), `«exclusiva» solo se permite en preguntas de tipo multiple; ${id ?? '?'} es ${tipo || 'de otro tipo'}`, id);
          }
          if (o.terminaCuestionario === true && tipo !== 'unica' && tipo !== 'sino') {
            e('cuestionario', sub(rutaO, 'terminaCuestionario'), `«terminaCuestionario» solo se permite en preguntas de tipo unica o sino; ${id ?? '?'} es ${tipo || 'de otro tipo'}`, id);
          }
          const el = lista(o.efectos, 'cuestionario', sub(rutaO, 'efectos'), 'efectos', true, id);
          el?.forEach((ef, m) => {
            const rutaE = `${rutaO}.efectos[${m}]`;
            if (!esObj(ef)) { e('cuestionario', rutaE, 'cada efecto debe ser un conjunto de campos', id); return; }
            camposPermitidos(ef, ['si', 'nivel', 'paquetes', 'anexos', 'alertas', 'parametros', 'motivo'], 'cuestionario', rutaE, id);
            // 05-diseno §2.6.14: parámetros del proyecto fijados por una respuesta (REQ-74).
            if (ef.parametros !== undefined) {
              const rutaPa = sub(rutaE, 'parametros');
              if (!esObj(ef.parametros)) e('cuestionario', rutaPa, `«parametros» de ${id ?? '?'} debe ser un conjunto «parámetro: clave de ajustes»`, id);
              else {
                for (const [clave, fuente] of Object.entries(ef.parametros)) {
                  if (!CLAVES_AJUSTABLES.includes(clave)) {
                    e('cuestionario', sub(rutaPa, clave), `«${clave}» no es un parámetro ajustable por respuesta (se admiten: ${CLAVES_AJUSTABLES.join(', ')})`, id);
                  }
                  if (typeof fuente !== 'string' || !CLAVES_PLAZO.includes(fuente)) {
                    e('cuestionario', sub(rutaPa, clave), `el valor de «${clave}» debe ser una clave de plazo de ajustes.yaml (${CLAVES_PLAZO.join(', ')}), pero es ${describir(fuente)}`, id);
                  }
                  const previa = parametroFijadoPor.get(clave);
                  if (previa !== undefined && previa !== id) {
                    e('cuestionario', sub(rutaPa, clave), `el parámetro «${clave}» lo fijan dos preguntas (${previa} y ${id ?? '?'}); solo una puede fijarlo`, id);
                  }
                  if (id !== undefined) parametroFijadoPor.set(clave, id);
                }
              }
            }
            const donde = `la opción «${valor ?? '?'}» de ${id ?? '?'}`;
            if (ef.si !== undefined) validarCond(ef.si, sub(rutaE, 'si'), { archivo: 'cuestionario', donde: `«si» de un efecto de ${donde}`, id, fase: 1 });
            if (m === el.length - 1 && ef.si !== undefined) {
              e('cuestionario', sub(rutaE, 'si'), `el último efecto de ${donde} no puede tener «si»: debe aplicarse siempre`, id);
            }
            if (ef.nivel !== undefined && (typeof ef.nivel !== 'string' || !NIVELES.includes(ef.nivel))) {
              e('cuestionario', sub(rutaE, 'nivel'), `el nivel ${describir(ef.nivel)} de ${donde} no es válido; use ${NIVELES.join(', ')} entre comillas`, id);
            }
            validarEfectoBase(ef, rutaE, donde, id);
          });
        });
        if (tipo === 'sino') {
          const esperado = ['si', 'no', 'nose'];
          const ok = ol.length === 3 && esperado.every((v) => valoresVistos.has(v));
          if (!ok) e('cuestionario', sub(ruta, 'opciones'), `una pregunta de tipo sino debe tener exactamente las opciones si, no y nose (${id ?? '?'})`, id);
        }
      });
    });

    // Condiciones derivadas (punto 4 y 5)
    const cl = lista(cuest.condiciones, 'cuestionario', 'condiciones', 'condiciones', false);
    const previas = new Set        ();
    cl?.forEach((c, i) => {
      const ruta = `condiciones[${i}]`;
      if (!esObj(c)) { e('cuestionario', ruta, 'cada condición derivada debe ser un conjunto de campos'); return; }
      const id = typeof c.id === 'string' ? c.id : undefined;
      camposPermitidos(c, ['id', 'descripcion', 'si'], 'cuestionario', ruta, id);
      texto(c, 'descripcion', 'cuestionario', ruta, id);
      if (c.si === undefined) e('cuestionario', sub(ruta, 'si'), `falta el campo «si» de la condición ${id ?? '?'}`, id);
      else validarCond(c.si, sub(ruta, 'si'), { archivo: 'cuestionario', donde: `la condición derivada ${id ?? '?'}`, id, fase: 1, previas: new Set(previas) });
      if (id) previas.add(id);
    });

    // Efectos globales
    const gl = lista(cuest.efectosGlobales, 'cuestionario', 'efectosGlobales', 'efectosGlobales', false);
    gl?.forEach((g, i) => {
      const ruta = `efectosGlobales[${i}]`;
      if (!esObj(g)) { e('cuestionario', ruta, 'cada efecto global debe ser un conjunto de campos'); return; }
      camposPermitidos(g, ['si', 'paquetes', 'anexos', 'alertas', 'seccionesF04', 'motivo', 'nivel'], 'cuestionario', ruta);
      const donde = `el efecto global n.º ${i + 1}`;
      if ('nivel' in g) e('cuestionario', sub(ruta, 'nivel'), `${donde} no puede fijar el nivel: los efectos globales no cambian el nivel`);
      if (g.si === undefined) e('cuestionario', sub(ruta, 'si'), `falta el campo «si» de ${donde}`);
      else validarCond(g.si, sub(ruta, 'si'), { archivo: 'cuestionario', donde: `«si» de ${donde}`, fase: 2 });
      referencias(g.seccionesF04, secciones, !!docs, 'la sección del formulario', 'cuestionario', ruta, 'seccionesF04', donde);
      validarEfectoBase(g, ruta, donde, undefined);
    });

    // Alertas
    const al = lista(cuest.alertas, 'cuestionario', 'alertas', 'alertas', false);
    al?.forEach((a, i) => {
      const ruta = `alertas[${i}]`;
      if (!esObj(a)) { e('cuestionario', ruta, 'cada alerta debe ser un conjunto de campos'); return; }
      const id = typeof a.id === 'string' ? a.id : undefined;
      camposPermitidos(a, ['id', 'texto'], 'cuestionario', ruta, id);
      texto(a, 'texto', 'cuestionario', ruta, id);
    });
  }

  // =========================================================================
  // Pasada 2: compromisos.yaml
  // =========================================================================
  const validarRespuestas = (v         , ruta        , donde        , id        )       => {
    const rl = lista(v, 'compromisos', ruta, 'respuestas', false, id);
    rl?.forEach((r, i) => {
      const rr = sub(ruta, i);
      if (!esObj(r)) { e('compromisos', rr, 'cada respuesta-tipo debe ser un conjunto de campos', id); return; }
      camposPermitidos(r, ['item', 'texto', 'pista', 'si', 'excluirSi', 'motivoExclusion'], 'compromisos', rr, id);
      if (typeof r.item !== 'string') e('compromisos', sub(rr, 'item'), `falta el ítem del formulario (item) en ${donde}`, id);
      else if (docs && !itemsF04.has(r.item)) e('compromisos', sub(rr, 'item'), `el ítem del formulario ${r.item} no existe (citado en ${donde})`, id);
      texto(r, 'texto', 'compromisos', rr, id);
      textoOpcional(r, 'pista', 'compromisos', rr, id);
      if (r.si !== undefined) validarCond(r.si, sub(rr, 'si'), { archivo: 'compromisos', donde: `«si» de una respuesta de ${donde}`, id, fase: 3 });
      if (r.excluirSi !== undefined) {
        validarCond(r.excluirSi, sub(rr, 'excluirSi'), { archivo: 'compromisos', donde: `«excluirSi» de una respuesta de ${donde}`, id, fase: 3 });
        if (!esTexto(r.motivoExclusion)) e('compromisos', sub(rr, 'motivoExclusion'), `falta «motivoExclusion»: toda respuesta con «excluirSi» debe explicar por qué no se prellena (${donde})`, id);
      }
    });
  };

  if (comp) {
    camposPermitidos(comp, ['borrador', 'noAceptada', 'paquetes'], 'compromisos', '');
    // 05-diseno §2.2 y §2.6.14: textos para una regla que el IR no acepta (REQ-71, 72).
    if (!esObj(comp.noAceptada)) e('compromisos', 'noAceptada', 'falta «noAceptada» (textos motivo, motivoExclusion y notaCI para una regla que el IR declara que no puede cumplir)');
    else {
      camposPermitidos(comp.noAceptada, ['motivo', 'motivoExclusion', 'notaCI'], 'compromisos', 'noAceptada');
      for (const k of ['motivo', 'motivoExclusion', 'notaCI']) texto(comp.noAceptada, k, 'compromisos', 'noAceptada');
    }
    if (typeof comp.borrador !== 'string' || !comp.borrador.includes('BORRADOR')) {
      e('compromisos', 'borrador', 'el campo «borrador» debe existir y contener la palabra BORRADOR (los textos son provisionales hasta que el CEBB y la Dirección Jurídica los validen)');
    }
    const pl = lista(comp.paquetes, 'compromisos', 'paquetes', 'paquetes', true);
    pl?.forEach((p, i) => {
      const rutaP = `paquetes[${i}]`;
      if (!esObj(p)) { e('compromisos', rutaP, 'cada paquete debe ser un conjunto de campos'); return; }
      const idP = typeof p.id === 'string' ? p.id : undefined;
      camposPermitidos(p, ['id', 'nombre', 'proposito', 'reglas'], 'compromisos', rutaP, idP);
      texto(p, 'nombre', 'compromisos', rutaP, idP);
      texto(p, 'proposito', 'compromisos', rutaP, idP);
      const rl = lista(p.reglas, 'compromisos', sub(rutaP, 'reglas'), 'reglas', true, idP);
      rl?.forEach((r, j) => {
        const rutaR = `${rutaP}.reglas[${j}]`;
        if (!esObj(r)) { e('compromisos', rutaR, 'cada regla debe ser un conjunto de campos', idP); return; }
        const id = typeof r.id === 'string' ? r.id : undefined;
        camposPermitidos(r, ['id', 'titulo', 'aplicaCuando', 'compromiso', 'fundamento', 'respuestas', 'variantes'], 'compromisos', rutaR, id);
        texto(r, 'titulo', 'compromisos', rutaR, id);
        texto(r, 'compromiso', 'compromisos', rutaR, id);
        fundamentoValido(r, 'compromisos', rutaR, id, true);
        if (r.aplicaCuando !== undefined) validarCond(r.aplicaCuando, sub(rutaR, 'aplicaCuando'), { archivo: 'compromisos', donde: `aplicaCuando de la regla ${id ?? '?'}`, id, fase: 2 });
        if (r.respuestas === undefined) e('compromisos', sub(rutaR, 'respuestas'), `falta el campo «respuestas» de la regla ${id ?? '?'} (puede ser una lista vacía)`, id);
        else validarRespuestas(r.respuestas, sub(rutaR, 'respuestas'), `la regla ${id ?? '?'}`, id ?? '');
        if (r.variantes !== undefined) {
          const vl = lista(r.variantes, 'compromisos', sub(rutaR, 'variantes'), 'variantes', false, id);
          const claves = new Set        ();
          vl?.forEach((v, k) => {
            const rutaV = `${rutaR}.variantes[${k}]`;
            if (!esObj(v)) { e('compromisos', rutaV, 'cada variante debe ser un conjunto de campos', id); return; }
            camposPermitidos(v, ['clave', 'si', 'compromiso', 'fundamento', 'respuestas'], 'compromisos', rutaV, id);
            if (typeof v.clave !== 'string' || !RE_SNAKE.test(v.clave)) e('compromisos', sub(rutaV, 'clave'), `la clave de la variante de ${id ?? '?'} debe estar en minúsculas con guion bajo (snake_case)`, id);
            else {
              if (claves.has(v.clave)) e('compromisos', sub(rutaV, 'clave'), `la clave de variante «${v.clave}» está repetida en la regla ${id ?? '?'}`, id);
              claves.add(v.clave);
            }
            const donde = `la variante «${String(v.clave)}» de la regla ${id ?? '?'}`;
            if (v.si === undefined) e('compromisos', sub(rutaV, 'si'), `falta el campo «si» de ${donde}`, id);
            else validarCond(v.si, sub(rutaV, 'si'), { archivo: 'compromisos', donde: `«si» de ${donde}`, id, fase: 2 });
            textoOpcional(v, 'compromiso', 'compromisos', rutaV, id);
            fundamentoValido(v, 'compromisos', rutaV, id, false);
            if (v.respuestas !== undefined) validarRespuestas(v.respuestas, sub(rutaV, 'respuestas'), donde, id ?? '');
          });
        }
      });
    });
  }

  // =========================================================================
  // Pasada 2: documentos.yaml
  // =========================================================================
  if (docs) {
    camposPermitidos(docs, ['anexos', 'documentos', 'f04', 'ci', 'textos'], 'documentos', '');
    const al = lista(docs.anexos, 'documentos', 'anexos', 'anexos', true);
    al?.forEach((a, i) => {
      const ruta = `anexos[${i}]`;
      if (!esObj(a)) { e('documentos', ruta, 'cada anexo debe ser un conjunto de campos'); return; }
      const id = typeof a.id === 'string' ? a.id : undefined;
      camposPermitidos(a, ['id', 'nombre', 'prellenadoPor', 'enlace'], 'documentos', ruta, id);
      texto(a, 'nombre', 'documentos', ruta, id);
      if (a.prellenadoPor !== undefined) {
        if (typeof a.prellenadoPor !== 'string' || !documentos.has(a.prellenadoPor)) {
          e('documentos', sub(ruta, 'prellenadoPor'), `el documento ${describir(a.prellenadoPor)} no existe (citado en «prellenadoPor» del anexo ${id ?? '?'})`, id);
        }
      }
      if (a.enlace !== undefined) {
        if (typeof a.enlace !== 'string' || !CLAVES_URL.includes(a.enlace)) {
          e('documentos', sub(ruta, 'enlace'), `el enlace ${describir(a.enlace)} del anexo ${id ?? '?'} no es una clave de ajustes válida (${CLAVES_URL.join(', ')})`, id);
        }
      }
    });
    const dl = lista(docs.documentos, 'documentos', 'documentos', 'documentos', true);
    dl?.forEach((d, i) => {
      const ruta = `documentos[${i}]`;
      if (!esObj(d)) { e('documentos', ruta, 'cada documento debe ser un conjunto de campos'); return; }
      const id = typeof d.id === 'string' ? d.id : undefined;
      camposPermitidos(d, ['id', 'nombre', 'formato', 'instruccion'], 'documentos', ruta, id);
      texto(d, 'nombre', 'documentos', ruta, id);
      enumerado(d, 'formato', FORMATOS_DOC, 'documentos', ruta, id);
      // 05-diseno §2.6.13: instrucción obligatoria en los documentos que se ofrecen con un botón.
      if (d.formato === 'pdf' || d.formato === 'doc') texto(d, 'instruccion', 'documentos', ruta, id);
      else textoOpcional(d, 'instruccion', 'documentos', ruta, id);
    });

    // Formulario 04
    if (!esObj(docs.f04)) e('documentos', 'f04', 'falta «f04» (un conjunto de campos con la lista «secciones»)');
    else {
      const sl = lista(docs.f04.secciones, 'documentos', 'f04.secciones', 'secciones', true);
      sl?.forEach((s, i) => {
        const ruta = `f04.secciones[${i}]`;
        if (!esObj(s)) { e('documentos', ruta, 'cada sección debe ser un conjunto de campos'); return; }
        const id = typeof s.id === 'string' ? s.id : undefined;
        camposPermitidos(s, ['id', 'titulo', 'instruccion', 'items'], 'documentos', ruta, id);
        texto(s, 'titulo', 'documentos', ruta, id);
        textoOpcional(s, 'instruccion', 'documentos', ruta, id);
        const il = lista(s.items, 'documentos', sub(ruta, 'items'), 'items', true, id);
        il?.forEach((it, j) => {
          const rutaI = `${ruta}.items[${j}]`;
          if (!esObj(it)) { e('documentos', rutaI, 'cada ítem debe ser un conjunto de campos', id); return; }
          const idI = typeof it.id === 'string' ? it.id : id;
          camposPermitidos(it, ['id', 'enunciado', 'plantilla', 'listaAnexos', 'pista', 'noAplica'], 'documentos', rutaI, idI);
          texto(it, 'enunciado', 'documentos', rutaI, idI);
          textoOpcional(it, 'plantilla', 'documentos', rutaI, idI);
          textoOpcional(it, 'pista', 'documentos', rutaI, idI);
          booleanoOpcional(it, 'listaAnexos', 'documentos', rutaI, idI);
          if (it.noAplica !== undefined) {
            const rn = sub(rutaI, 'noAplica');
            if (!esObj(it.noAplica)) e('documentos', rn, '«noAplica» debe ser un conjunto de campos (texto, si, sugerencia)', idI);
            else {
              camposPermitidos(it.noAplica, ['texto', 'si', 'sugerencia'], 'documentos', rn, idI);
              texto(it.noAplica, 'texto', 'documentos', rn, idI);
              booleanoOpcional(it.noAplica, 'sugerencia', 'documentos', rn, idI);
              if (it.noAplica.si !== undefined) validarCond(it.noAplica.si, sub(rn, 'si'), { archivo: 'documentos', donde: `«no aplica» del ítem ${idI ?? '?'}`, id: idI, fase: 3 });
            }
          }
        });
      });
    }

    // Consentimiento informado
    if (!esObj(docs.ci)) e('documentos', 'ci', 'falta «ci» (un conjunto de campos con la lista «variantes»)');
    else {
      const vl = lista(docs.ci.variantes, 'documentos', 'ci.variantes', 'variantes', true);
      const claves = new Set        ();
      vl?.forEach((v, i) => {
        const ruta = `ci.variantes[${i}]`;
        if (!esObj(v)) { e('documentos', ruta, 'cada variante del consentimiento debe ser un conjunto de campos'); return; }
        const clave = typeof v.clave === 'string' ? v.clave : undefined;
        camposPermitidos(v, ['clave', 'si', 'titulo', 'elementos'], 'documentos', ruta, clave);
        if (clave === undefined || !RE_SNAKE.test(clave)) e('documentos', sub(ruta, 'clave'), 'la clave de la variante del consentimiento debe estar en minúsculas con guion bajo (snake_case)');
        else {
          if (claves.has(clave)) e('documentos', sub(ruta, 'clave'), `la clave de variante «${clave}» del consentimiento está repetida`, clave);
          claves.add(clave);
        }
        if (v.si === undefined) e('documentos', sub(ruta, 'si'), `falta el campo «si» de la variante «${clave ?? '?'}» del consentimiento`, clave);
        else validarCond(v.si, sub(ruta, 'si'), { archivo: 'documentos', donde: `«si» de la variante «${clave ?? '?'}» del consentimiento`, id: clave, fase: 3 });
        texto(v, 'titulo', 'documentos', ruta, clave);
        const el = lista(v.elementos, 'documentos', sub(ruta, 'elementos'), 'elementos', false, clave);
        const cel = new Set        ();
        el?.forEach((x, j) => {
          const rutaX = `${ruta}.elementos[${j}]`;
          if (!esObj(x)) { e('documentos', rutaX, 'cada elemento debe ser un conjunto de campos', clave); return; }
          const ce = typeof x.clave === 'string' ? x.clave : undefined;
          camposPermitidos(x, ['clave', 'titulo', 'texto', 'si', 'notaIR'], 'documentos', rutaX, clave);
          if (ce === undefined || !RE_SNAKE.test(ce)) e('documentos', sub(rutaX, 'clave'), `la clave del elemento debe estar en minúsculas con guion bajo (snake_case) en la variante «${clave ?? '?'}»`, clave);
          else {
            if (cel.has(ce)) e('documentos', sub(rutaX, 'clave'), `la clave de elemento «${ce}» está repetida en la variante «${clave ?? '?'}»`, clave);
            cel.add(ce);
          }
          textoOpcional(x, 'titulo', 'documentos', rutaX, clave);
          texto(x, 'texto', 'documentos', rutaX, clave);
          booleanoOpcional(x, 'notaIR', 'documentos', rutaX, clave);
          if (x.si !== undefined) validarCond(x.si, sub(rutaX, 'si'), { archivo: 'documentos', donde: `«si» del elemento «${ce ?? '?'}» de la variante «${clave ?? '?'}»`, id: clave, fase: 3 });
        });
      });
    }

    // Textos fijos (punto 12)
    if (!esObj(docs.textos)) e('documentos', 'textos', 'falta «textos» (grupos comun y DOC-* con sus textos)');
    else {
      for (const [grupo, claves] of Object.entries(TEXTOS_OBLIGATORIOS)) {
        const g = docs.textos[grupo];
        if (!esObj(g)) {
          e('documentos', sub('textos', grupo), `falta el grupo de textos «${grupo}» en «textos»`, grupo);
          continue;
        }
        for (const c of claves) {
          if (!esTexto(g[c])) e('documentos', sub(sub('textos', grupo), c), `falta el texto «${c}» del grupo «${grupo}» (obligatorio; debe ser un texto no vacío)`, grupo);
        }
      }
      for (const [grupo, g] of Object.entries(docs.textos)) {
        if (!esObj(g)) { if (!(grupo in TEXTOS_OBLIGATORIOS)) e('documentos', sub('textos', grupo), `el grupo de textos «${grupo}» debe ser un conjunto de textos`); continue; }
        for (const [c, t] of Object.entries(g)) {
          if (typeof t !== 'string') e('documentos', sub(sub('textos', grupo), c), `el texto «${c}» del grupo «${grupo}» debe ser un texto, pero es ${describir(t)}`);
        }
      }
    }
  }

  // =========================================================================
  // ajustes.yaml (punto 10) e interfaz.yaml
  // =========================================================================
  if (ajus) {
    for (const k of CLAVES_AJUSTES) {
      if (ajus[k] === undefined || ajus[k] === null) e('ajustes', k, `falta el ajuste «${k}»`, k);
    }
    for (const k of Object.keys(ajus)) {
      if (!CLAVES_AJUSTES.includes(k)) e('ajustes', k, `el ajuste «${k}» no existe (¿error de escritura?)`, k);
    }
    for (const k of ['version', 'correoCebb', 'viaDerechos', 'contactoIncidentes', 'almacenamientoInstitucional', ...CLAVES_URL]) {
      if (ajus[k] !== undefined && ajus[k] !== null && !esTexto(ajus[k])) {
        e('ajustes', k, `el ajuste «${k}» debe ser un texto no vacío (escríbalo entre comillas), pero es ${describir(ajus[k])}`, k);
      }
    }
    // El logotipo se sirve junto a la herramienta: ruta relativa, sin esquema ni «..» (REQ-40).
    const logo = ajus.logo;
    if (logo !== undefined && logo !== null && (typeof logo !== 'string' || !/^(?!\/)(?!.*\.\.)[\w./-]+\.(svg|png|jpe?g)$/i.test(logo))) {
      e('ajustes', 'logo', `«logo» debe ser la ruta relativa de un archivo .svg, .png o .jpg junto a la herramienta (p. ej. marca/fi-udec.svg), sin URL, pero es ${describir(logo)}`, 'logo');
    }
    for (const k of CLAVES_PLAZO) {
      const v = ajus[k];
      if (v !== undefined && v !== null && !(typeof v === 'number' && Number.isInteger(v) && v > 0)) {
        e('ajustes', k, `el plazo «${k}» debe ser un número entero positivo de meses, pero es ${describir(v)}`, k);
      }
    }
    // REQ-76: el plazo extendido debe superar al común.
    if (typeof ajus.conservacionMeses === 'number' && typeof ajus.conservacionExtendidaMeses === 'number'
      && ajus.conservacionExtendidaMeses <= ajus.conservacionMeses) {
      e('ajustes', 'conservacionExtendidaMeses', `«conservacionExtendidaMeses» (${ajus.conservacionExtendidaMeses}) debe ser mayor que «conservacionMeses» (${ajus.conservacionMeses})`, 'conservacionExtendidaMeses');
    }
    const rn = ajus.redaccionNivel1;
    if (rn !== undefined && rn !== null && rn !== 'registro' && rn !== 'solicitud_abreviada') {
      e('ajustes', 'redaccionNivel1', `«redaccionNivel1» debe ser «registro» o «solicitud_abreviada», pero es ${describir(rn)}`, 'redaccionNivel1');
    }
    const f = ajus.fechaVigencia21719;
    if (f instanceof Date) {
      e('ajustes', 'fechaVigencia21719', 'la fecha «fechaVigencia21719» se leyó como fecha de YAML; escríbala entre comillas, por ejemplo "2026-12-01"', 'fechaVigencia21719');
    } else if (f !== undefined && f !== null && !(typeof f === 'string' && RE_FECHA.test(f))) {
      e('ajustes', 'fechaVigencia21719', `«fechaVigencia21719» debe ser un texto con formato AAAA-MM-DD (entre comillas), pero es ${describir(f)}`, 'fechaVigencia21719');
    } else if (typeof f === 'string' && Number.isNaN(Date.parse(f))) {
      e('ajustes', 'fechaVigencia21719', `«fechaVigencia21719» (${f}) no es una fecha real`, 'fechaVigencia21719');
    }
  }
  if (inter) {
    for (const [k, v] of Object.entries(inter)) {
      if (!esTexto(v)) e('interfaz', k, `el texto de interfaz «${k}» debe ser un texto no vacío, pero es ${describir(v)}`);
    }
  }

  // =========================================================================
  // Marcadores (punto 9, REQ-55): todo string de todos los archivos
  // =========================================================================
  const revisarMarcadores = (v         , archivo               , ruta        , profundidad        )       => {
    if (profundidad > 60) return;
    if (typeof v === 'string') {
      const usados = v.matchAll(/\{([^{}]*)\}/g);
      for (const m of usados) {
        const t = m[1];
        if (t.startsWith('D-')) {
          if (archivo === 'interfaz') e(archivo, ruta, `el marcador {${t}} no se puede usar en interfaz.yaml: allí solo se admiten marcadores {ajustes.clave}`, t);
          else if (cuest && !datos.has(t)) e(archivo, ruta, `el marcador {${t}} no corresponde a ningún campo de datos declarado en cuestionario.datos`, t);
        } else if (t.startsWith('ajustes.')) {
          const k = t.slice('ajustes.'.length);
          if (!CLAVES_AJUSTES.includes(k)) e(archivo, ruta, `el marcador {${t}} no corresponde a ninguna clave de ajustes.yaml`, t);
        } else {
          e(archivo, ruta, `marcador desconocido {${t}}: solo se admiten {D-...} y {ajustes.clave}`, t);
        }
      }
      const resto = v.replace(/\{[^{}]*\}/g, '');
      if (/[{}]/.test(resto)) e(archivo, ruta, 'hay una llave { o } sin pareja: los marcadores deben escribirse completos, como {D-TITULO} o {ajustes.version}');
      return;
    }
    if (Array.isArray(v)) v.forEach((x, i) => revisarMarcadores(x, archivo, sub(ruta, i), profundidad + 1));
    else if (esObj(v)) for (const [k, x] of Object.entries(v)) revisarMarcadores(x, archivo, sub(ruta, k), profundidad + 1);
  };
  for (const archivo of ARCHIVOS) {
    const r = raiz[archivo];
    if (r) revisarMarcadores(r, archivo, '', 0);
  }

  if (errores.length > 0) return { ok: false, errores };
  return { ok: true, config: crudo                      };
}
