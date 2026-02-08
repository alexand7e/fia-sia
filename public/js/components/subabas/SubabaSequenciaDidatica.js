import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateGeneric } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaSequenciaDidatica(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Sequência didática</h2>
            <p class="text-sm text-slate-500">Detalhe a unidade em aulas, do objetivo à tarefa.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Unidade</label>
              <input data-field="unidade" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: Funções lineares" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Quantidade de aulas</label>
              <input data-field="aulas" type="number" min="1" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: 8" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-64 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Sequência por aula (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const unidadeEl = mustGet(root, '[data-field="unidade"]');
      const aulasEl = mustGet(root, '[data-field="aulas"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      unidadeEl.value = state.seq?.unidade || '';
      aulasEl.value = state.seq?.aulas || '';
      outputEl.value = state.seq?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        ctx.storage.write({
          ...ctx.storage.read(),
          seq: { unidade: unidadeEl.value || '', aulas: aulasEl.value || '', rawJson: outputEl.value || '' }
        });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';
          const prompt = `Retorne APENAS um JSON válido.
Gere uma sequência didática para a unidade "${unidadeEl.value}" com ${Number(aulasEl.value || 1)} aulas.
Schema sugerido:
{"unidade":"string","aulas":[{"aula":1,"objetivo":"string","atividade":"string","checagem":"string","tarefa":"string"}]}`
          ;
          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';
          const extracted = json ? { success: true, data: json } : extractJson(String(text));
          if (!extracted.success) throw extracted.error;
          const validated = validateGeneric(extracted.data);
          if (!validated.ok) throw new Error(validated.errors.join('; '));
          outputEl.value = JSON.stringify(validated.value, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), seq: { unidade: unidadeEl.value || '', aulas: aulasEl.value || '', rawJson: outputEl.value } });
          statusEl.textContent = 'Gerado';
        } catch (e) {
          statusEl.textContent = e instanceof Error ? e.message : 'Erro ao gerar';
        } finally {
          aiBtn.disabled = false;
          setTimeout(() => { statusEl.textContent = ''; }, 2200);
        }
      });

      container.appendChild(root);
    }
  };
}

export default SubabaSequenciaDidatica;

