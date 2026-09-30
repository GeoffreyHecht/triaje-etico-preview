// Pantalla de resultado (05-diseno §7.1, paso 3; REQ-09, 14, 17, 57).
// Solo muestra el nivel y sus motivos; los datos y los documentos están en la pantalla siguiente.
import { componerReglas } from '../motor/componer.js';
                                                  
import { aHtml } from '../motor/marcadores.js';
import { documentosHabilitados, pasoDePregunta, reglasDeclarables } from './estado.js';
import { conHtml, h } from './dom.js';
import { listaDecisivos, listaMotivos, textoNivel } from './motivos.js';
import { agruparReglasPorPaquete } from './formato.js';
                                          

const CLAVE_REGLAS = 'seccion:reglas';
const ID_ALTERNAR = 'reglas-alternar';

/**
 * Reglas del proyecto y su aceptación (05-diseno §7.1, «Aceptación»; REQ-70): tarjeta visible con la frase
 * según el nivel, el estado (todas aceptadas o las no aceptadas con «Volver a aceptar») y un botón que muestra
 * la lista; en la lista, cada regla es una fila con su título plegable y la casilla «No se puede cumplir».
 */
function seccionReglas(s        , reglas                  )              {
  const { config, resultado } = s;
  const declarables = new Set(reglasDeclarables(s.estado, config));
  const noAceptadas = resultado.reglasNoAceptadas;
  const titulo = (id        )         => reglas.find((r) => r.id === id)?.titulo ?? id;
  const abierta = s.ayudasAbiertas.has(CLAVE_REGLAS);

  const sec = h('section', { class: 'reglas tarjeta-reglas', 'aria-labelledby': 'reglas-titulo' },
    h('h3', { id: 'reglas-titulo' }, `${s.t('reglasTitulo')} (${reglas.length})`));
  if (declarables.size > 0) {
    const clave = resultado.nivel === '1' ? 'reglasIntroNivel1' : 'reglasIntroNivel2';
    sec.append(h('p', { class: 'reglas-aceptacion' }, s.t(clave).replace('%n', String(reglas.length))));
  }

  // Estado siempre visible: todas aceptadas, o las no aceptadas con «Volver a aceptar».
  if (noAceptadas.length === 0) {
    if (declarables.size > 0) sec.append(h('p', { class: 'reglas-estado' }, s.t('reglasTodasAceptadas')));
  } else {
    const ul = h('ul', { class: 'reglas-no-aceptadas' });
    for (const id of noAceptadas) {
      const volver = h('button', { type: 'button', class: 'secundario compacto', 'aria-describedby': `noacep_resumen_${id}` }, s.t('reglaVolverAceptar'));
      volver.addEventListener('click', () => {
        document.getElementById(ID_ALTERNAR)?.focus();   // el botón desaparece al redibujar: el foco pasa al de la lista
        s.alternarNoAceptada(id, false);
      });
      ul.append(h('li', {}, h('span', { id: `noacep_resumen_${id}` }, `«${titulo(id)}» `, h('small', { class: 'regla-id' }, id)), ' ', volver));
    }
    sec.append(h('p', { class: 'reglas-estado' }, h('strong', {}, `${s.t('reglasNoAceptadasTitulo')} (${noAceptadas.length})`)), ul);
  }

  const lista = h('div', { id: 'reglas-lista', class: 'reglas-lista' });
  lista.hidden = !abierta;
  const alternar = h('button', { type: 'button', id: ID_ALTERNAR, class: 'secundario', 'aria-expanded': abierta ? 'true' : 'false', 'aria-controls': 'reglas-lista' },
    s.t(abierta ? 'reglasOcultar' : (declarables.size > 0 ? 'reglasRevisar' : 'reglasVer')));
  alternar.addEventListener('click', () => {
    const abrir = lista.hidden;
    lista.hidden = !abrir;
    alternar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    alternar.textContent = s.t(abrir ? 'reglasOcultar' : (declarables.size > 0 ? 'reglasRevisar' : 'reglasVer'));
    if (abrir) s.ayudasAbiertas.add(CLAVE_REGLAS);
    else s.ayudasAbiertas.delete(CLAVE_REGLAS);
  });
  sec.append(alternar, lista);

  const marcadas = new Set(noAceptadas);
  for (const g of agruparReglasPorPaquete(reglas, config.compromisos.paquetes)) {
    lista.append(h('h4', {}, g.paquete.nombre));
    for (const r of g.reglas) {
      const no = marcadas.has(r.id);
      const fila = h('div', { class: no ? 'regla-fila no-aceptada' : 'regla-fila' });
      fila.append(h('details', { class: 'regla' },
        h('summary', {}, h('span', { id: `regla_${r.id}_titulo` }, r.titulo), ' ', h('small', { class: 'regla-id' }, r.id),
          no ? h('span', { class: 'etiqueta-no-aceptada' }, s.t('reglaNoAceptadaEtiqueta')) : null),
        conHtml('p', {}, aHtml(r.compromiso)),
        r.fundamento !== '' ? h('p', { class: 'fundamento' }, h('strong', {}, `${s.t('fundamento')}: `), r.fundamento) : null));
      if (declarables.has(r.id)) {
        const id = `noacep_${r.id}`;
        const casilla = h('input', { type: 'checkbox', id, checked: no, 'aria-describedby': `regla_${r.id}_titulo` })                    ;
        casilla.checked = no;
        casilla.addEventListener('change', () => {
          s.ayudasAbiertas.add(CLAVE_REGLAS);
          s.alternarNoAceptada(r.id, casilla.checked);
        });
        fila.append(h('div', { class: 'regla-casilla' }, casilla, h('label', { for: id }, s.t('reglaNoSePuedeCumplir'))));
      }
      lista.append(fila);
    }
  }
  return sec;
}

/**
 * Con el cuestionario incompleto (REQ-14), las pantallas de resultado y de documentos muestran solo las
 * preguntas pendientes (con enlace a su pantalla), la exportación del borrador y «Anterior».
 */
export function pantallaPendientes(s        , titulo        )              {
  const { config, resultado } = s;
  const raiz = h('div', { class: 'pantalla' }, h('h2', { id: 'titulo-pantalla', tabindex: '-1' }, titulo));
  raiz.append(h('p', { class: 'aviso-provisional', role: 'status' }, s.t('resultadoProvisional')));
  const ul = h('ul', { class: 'pendientes-ir' });
  for (const id of resultado.pendientes) {
    const p = config.cuestionario.bloques.flatMap((b) => b.preguntas).find((q) => q.id === id);
    if (p === undefined) continue;
    const b = h('button', { type: 'button', class: 'enlace', title: s.t('pendientesIr') }, s.tq(p.texto));
    b.addEventListener('click', () => s.irA(pasoDePregunta(config, id)));
    ul.append(h('li', {}, b));
  }
  raiz.append(h('h3', {}, `${s.t('pendientes')} (${resultado.pendientes.length})`), ul);
  const nav = h('div', { class: 'botones-paso' });
  const atras = h('button', { type: 'button', class: 'secundario' }, s.t('anterior'));
  atras.addEventListener('click', () => s.retroceder());
  nav.append(atras);
  raiz.append(nav);
  return raiz;
}

export function pantallaResultado(s        )              {
  const { config, resultado } = s;
  if (!documentosHabilitados(resultado)) return pantallaPendientes(s, s.t('tituloResultado'));
  const nivel = config.cuestionario.niveles.find((n) => n.id === resultado.nivel);
  const raiz = h('div', { class: 'pantalla' }, h('h2', { id: 'titulo-pantalla', tabindex: '-1' }, s.t('tituloResultado')));

  raiz.append(h('section', { class: 'nivel-resultado', 'aria-labelledby': 'nivel-titulo' },
    h('h3', { id: 'nivel-titulo' }, textoNivel(s)),
    nivel !== undefined ? h('p', {}, nivel.resumen) : null));

  raiz.append(h('section', { 'aria-labelledby': 'motivos-titulo' },
    h('h3', { id: 'motivos-titulo' }, s.t('motivosTitulo')),
    listaDecisivos(s),
    h('details', { class: 'ayuda todas-respuestas' }, h('summary', {}, s.t('todasRespuestas')), listaMotivos(s))));

  if (resultado.alertas.length > 0) {
    const ul = h('ul', { class: 'alertas' });
    for (const id of resultado.alertas) {
      const a = config.cuestionario.alertas.find((x) => x.id === id);
      ul.append(h('li', {}, a?.texto ?? id));
    }
    raiz.append(h('section', { 'aria-labelledby': 'alertas-titulo' }, h('h3', { id: 'alertas-titulo' }, s.t('alertasTitulo')), ul));
  }

  const reglas = componerReglas(s.ctx());
  if (reglas.length > 0) raiz.append(seccionReglas(s, reglas));

  const nav = h('div', { class: 'botones-paso' });
  const atras = h('button', { type: 'button', class: 'secundario' }, s.t('anterior'));
  atras.addEventListener('click', () => s.retroceder());
  const sig = h('button', { type: 'button', class: 'primario' }, s.t('prepararDocumentos'));
  sig.addEventListener('click', () => s.avanzar());
  nav.append(atras, sig);
  raiz.append(nav);
  return raiz;
}
