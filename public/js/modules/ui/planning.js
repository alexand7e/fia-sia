import llmClient from '../services/llm-client.js';
import {
  createGerenciadorSubabas,
  SubabaContexto,
  SubabaCalendario,
  SubabaBimestres,
  SubabaUnidades,
  SubabaSequenciaDidatica,
  SubabaAvaliacoes,
  SubabaMateriais,
  SubabaRevisaoPublicacao
} from '../../components/subabas/index.js';

const STORAGE_KEY = 'planning_state_v2';

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * Inicializa o sistema de subabas do Planejamento.
 * @returns {Promise<void>}
 */
export async function initPlanningPage() {
  const navEl = document.getElementById('planning-subtabs-nav');
  const panelEl = document.getElementById('planning-subtabs-panel');
  if (!(navEl instanceof HTMLElement) || !(panelEl instanceof HTMLElement)) return;

  const storage = { read: readState, write: writeState };

  const ai = {
    /**
     * Executa prompt no backend.
     * @param {{prompt:string, model:'base'|'flash', responseFormat:'json'|'text'}} params
     * @returns {Promise<any>}
     */
    execute: async (params) => {
      return llmClient.executePrompt(params.prompt, {
        model: params.model,
        requireRecaptcha: true,
        responseFormat: params.responseFormat
      });
    }
  };

  createGerenciadorSubabas({
    navEl,
    panelEl,
    context: { storage, ai },
    initialId: 'contexto',
    subabas: [
      { id: 'contexto', title: 'Contexto', icon: 'badge', create: SubabaContexto },
      { id: 'calendario', title: 'Calendário', icon: 'calendar_month', create: SubabaCalendario },
      { id: 'bimestres', title: 'Bimestres', icon: 'view_timeline', create: SubabaBimestres },
      { id: 'unidades', title: 'Unidades', icon: 'category', create: SubabaUnidades },
      { id: 'sequencia', title: 'Sequência didática', icon: 'list_alt', create: SubabaSequenciaDidatica },
      { id: 'avaliacoes', title: 'Avaliações', icon: 'assignment_turned_in', create: SubabaAvaliacoes },
      { id: 'materiais', title: 'Materiais', icon: 'description', create: SubabaMateriais },
      { id: 'revisao', title: 'Revisão e publicação', icon: 'rule', create: SubabaRevisaoPublicacao }
    ]
  });

  const exportBtn = document.getElementById('planning-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(readState(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planejamento.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const resetBtn = document.getElementById('planning-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }
}

export default { initPlanningPage };
