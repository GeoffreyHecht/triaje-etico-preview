// Punto de entrada de la interfaz (05-diseno §7; REQ-09, 14, 40–43, 46, 48, 53, 56, 63, 64).
// Carga la configuración; si falla, muestra los errores y no corre el cuestionario.
                                                         
import { cargarConfig } from './cargar.js';
import { ajustesEfectivos } from './motor/ajustes.js';
import { textoConAjustes } from './ui/textos.js';
import {
  almacenNavegador, borrarLocal, crearBorrador, guardarLocal, leerLocal,
} from './borrador.js';
import {
  alternarReglaNoAceptada, aplicarBorrador, avanzar, calcular, camposDocumentos, datosVigentes, estadoInicial, fechaLocal, irA, pasosDisponibles,
  pasoSiguiente, retroceder,
} from './ui/estado.js';
                                                    
import { h, vaciar } from './ui/dom.js';
import { pantallaErrores } from './ui/errores.js';
import { menuBorrador } from './ui/borradorUi.js';
import { pantallaBloque, pantallaInicio } from './ui/pantallas.js';
import { pantallaDocumentos } from './ui/documentos.js';
import { pantallaResultado } from './ui/resultado.js';
                                                    

                                   

function firmaEstructura(s        )         {
  return JSON.stringify([
    pasosDisponibles(s.config, s.resultado),
    camposDocumentos(s.config, s.resultado).map((c) => c.id),
    s.resultado.visibles,
    s.resultado.documentos,
  ]);
}

function arrancar(raiz             , config        )       {
  const inicial = calcular(estadoInicial(), config);
  const almacen = almacenNavegador();
  const avisos          = [];
  let avisoNoGuardaMostrado = false;

  const t = (clave        )         => textoConAjustes(config.interfaz[clave] ?? clave, config.ajustes);

  const s         = {
    config,
    estado: inicial.estado,
    resultado: inicial.resultado,
    almacen,
    tocados: new Set(),
    ayudasAbiertas: new Set(),
    adjuntosMarcados: new Set(),
    t,
    tq: (texto) => textoConAjustes(texto, config.ajustes),
    tr: (texto) => textoConAjustes(texto, ajustesEfectivos(config, s.resultado)),
    alternarNoAceptada(regla, marcada) {
      s.aplicar(alternarReglaNoAceptada(s.estado, config, regla, marcada));
    },
    ctx()                 {
      return { config, resultado: s.resultado, datos: datosVigentes(config, s.resultado, s.estado.datos), fecha: fechaLocal(new Date()) };
    },
    aplicar(c) {
      fijar(c);
      guardar();
      dibujar('conservar');
    },
    aplicarSuave(c) {
      const antes = firmaEstructura(s);
      fijar(c);
      guardar();
      if (firmaEstructura(s) !== antes) dibujar('conservar');
    },
    irA(paso) {
      ir(irA(s.estado, config, s.resultado, paso).paso);
    },
    avanzar() {
      ir(avanzar(s.estado, config, s.resultado).paso);
    },
    retroceder() {
      ir(retroceder(s.estado, config, s.resultado).paso);
    },
    avisar(aviso) {
      avisos.push(aviso);
      dibujarAvisos();
    },
    reemplazar(c) {
      fijar(c);
      s.tocados.clear();
      guardar();
      dibujar('titulo');
    },
  };

  function fijar(c         )       {
    let paso       = c.estado.paso;
    // Si la pantalla actual dejó de existir (p. ej. un bloque que se cerró), pasa a la siguiente.
    if (!pasosDisponibles(config, c.resultado).includes(paso)) paso = pasoSiguiente(config, c.resultado, paso);
    s.estado = { ...c.estado, paso };
    s.resultado = c.resultado;
  }

  function ir(paso      )       {
    s.estado = { ...s.estado, paso };
    for (let i = avisos.length - 1; i >= 0; i--) if (avisos[i].fijo !== true) avisos.splice(i, 1);
    dibujar('titulo');
  }

  function guardar()       {
    const ok = guardarLocal(almacen, crearBorrador(s.estado.datos, s.estado.respuestas, config, s.ctx().fecha, s.estado.noAceptadas));
    if (!ok && !avisoNoGuardaMostrado) {
      avisoNoGuardaMostrado = true;
      avisos.push({ tipo: 'error', texto: t('borradorNoSeGuarda'), fijo: true });
      dibujarAvisos();
    }
  }

  // ---------------------------------------------------------------------
  // Esqueleto de la página (se arma una vez)
  // ---------------------------------------------------------------------
  document.title = t('tituloApp');
  // Zona «Borrador» de la cabecera: exportar, retomar y borrar juntos (05-diseno §7.1; REQ-43 a 45).
  const zonaBorrador = menuBorrador(s, () => {
    if (!window.confirm(t('confirmarBorrar'))) return;
    const ok = borrarLocal(almacen);
    const limpio = calcular(estadoInicial(), config);
    s.estado = limpio.estado;
    s.resultado = limpio.resultado;
    s.tocados.clear();
    s.ayudasAbiertas.clear();
    s.adjuntosMarcados.clear();
    avisos.length = 0;
    if (almacen !== null && !ok) avisos.push({ tipo: 'error', texto: t('borrarNoPosible'), fijo: true });
    else avisos.push({ tipo: 'info', texto: t('datosBorrados') });
    dibujar('titulo');
  });

  const navPasos = h('ol', { class: 'pasos' });
  const cajaAvisos = h('div', { id: 'avisos', class: 'avisos', role: 'status', 'aria-live': 'polite' });
  const pantalla = h('div', { id: 'pantalla' });

  const saltar = h('a', { class: 'saltar', href: '#contenido' }, t('saltarAlContenido'));
  saltar.addEventListener('click', (ev) => {
    ev.preventDefault();
    document.getElementById('contenido')?.focus();
  });

  vaciar(raiz);
  raiz.append(
    saltar,
    // Cabecera al estilo de la Facultad de Ingeniería: logotipo (ajustes.logo), título y comité.
    h('header', { class: 'cabecera' },
      h('div', { class: 'marca' },
        h('img', { class: 'logo', src: config.ajustes.logo, alt: t('logoAlt') }),
        h('div', { class: 'titulos' }, h('h1', {}, t('tituloApp')), h('p', { class: 'subtitulo' }, t('subtituloApp')))),
      zonaBorrador),
    h('div', { class: 'disposicion' },
      h('main', { id: 'contenido', tabindex: '-1' },
        h('nav', { 'aria-label': t('pasosEtiqueta') }, navPasos),
        cajaAvisos,
        pantalla)),
    h('footer', { class: 'pie' }, h('p', { class: 'etiqueta-borrador' }, config.compromisos.borrador), h('p', {}, t('version'))),
  );

  // ---------------------------------------------------------------------
  // Dibujo
  // ---------------------------------------------------------------------
  function dibujarPasos()       {
    vaciar(navPasos);
    const disp = pasosDisponibles(config, s.resultado);
    const bloques = disp.filter((p) => p.startsWith('bloque:'));
    const enCuestionario = s.estado.paso.startsWith('bloque:');
    const grupos                                                                                 = [
      { clave: 'inicio', texto: t('pasoInicio'), destino: 'inicio', actual: s.estado.paso === 'inicio' },
      {
        clave: 'cuestionario',
        texto: enCuestionario
          ? `${t('pasoCuestionario')} (${bloques.indexOf(s.estado.paso) + 1}/${bloques.length})`
          : t('pasoCuestionario'),
        destino: enCuestionario ? s.estado.paso : bloques[0],
        actual: enCuestionario,
      },
    ];
    grupos.push(
      { clave: 'resultado', texto: t('pasoResultado'), destino: 'resultado', actual: s.estado.paso === 'resultado' },
      { clave: 'documentos', texto: t('pasoDocumentos'), destino: 'documentos', actual: s.estado.paso === 'documentos' },
    );
    for (const g of grupos) {
      const b = h('button', { type: 'button', class: g.actual ? 'paso actual' : 'paso', 'aria-current': g.actual ? 'step' : null }, g.texto);
      b.addEventListener('click', () => {
        if (g.destino !== undefined && !g.actual) s.irA(g.destino);
      });
      navPasos.append(h('li', {}, b));
    }
  }

  function dibujarAvisos()       {
    vaciar(cajaAvisos);
    avisos.forEach((a, i) => {
      const cerrar = h('button', { type: 'button', class: 'cerrar', 'aria-label': t('cerrarAviso') }, '×');
      cerrar.addEventListener('click', () => {
        avisos.splice(i, 1);
        dibujarAvisos();
      });
      const detalles = a.detalles !== undefined && a.detalles.length > 0
        ? h('ul', {}, ...a.detalles.map((d) => h('li', {}, d)))
        : null;
      cajaAvisos.append(h('div', { class: `aviso aviso-${a.tipo}` }, h('div', { class: 'aviso-texto' }, h('p', {}, a.texto), detalles), cerrar));
    });
  }

  function dibujarPantalla()              {
    const p = s.estado.paso;
    if (p === 'inicio') return pantallaInicio(s);
    if (p === 'documentos') return pantallaDocumentos(s);
    if (p === 'resultado') return pantallaResultado(s);
    return pantallaBloque(s, p);
  }

  function dibujar(foco      )       {
    const idFoco = document.activeElement instanceof HTMLElement ? document.activeElement.id : '';
    dibujarPasos();
    dibujarAvisos();
    vaciar(pantalla);
    pantalla.append(dibujarPantalla());
    if (foco === 'titulo') {
      document.getElementById('titulo-pantalla')?.focus();
      window.scrollTo(0, 0);
    } else if (idFoco !== '') {
      document.getElementById(idFoco)?.focus();
    }
  }

  // ---------------------------------------------------------------------
  // Borrador local (REQ-42, REQ-47)
  // ---------------------------------------------------------------------
  const previo = leerLocal(almacen, config);
  if (previo !== null) {
    if (previo.ok) {
      fijar(aplicarBorrador(config, previo.borrador));
      avisos.push({ tipo: 'info', texto: t('borradorRestaurado') });
      if (previo.otraVersion) avisos.push({ tipo: 'info', texto: t('borradorOtraVersion') });
      if (previo.descartadas.length > 0) avisos.push({ tipo: 'info', texto: t('borradorDescartadas'), detalles: previo.descartadas });
    } else {
      avisos.push({ tipo: 'error', texto: t('importacionFallida'), detalles: [`${t(`errorBorrador_${previo.codigo}`)} ${previo.detalle}`.trim()] });
    }
  }
  dibujar('conservar');
}

async function iniciar()                {
  const raiz = document.getElementById('app');
  if (raiz === null) return;
  const res = await cargarConfig();
  if (!res.ok) {
    vaciar(raiz);
    raiz.append(pantallaErrores(res.errores));
    return;
  }
  arrancar(raiz, res.config);
}

void iniciar();
