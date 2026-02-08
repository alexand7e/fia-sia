import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateGeneric } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaBimestres(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Bimestres</h2>
            <p class="text-sm text-slate-500">Defina estrutura macro do ano (capacidade e marcos).</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Número de bimestres</label>
              <input data-field="num" type="number" min="1" max="4" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: 4" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Pesos de avaliação</label>
              <input data-field="pesos" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: P1 6/P2 4" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold mb-1">Semanas por bimestre</label>
              <textarea data-field="semanas" class="w-full h-20 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: B1: 9; B2: 10; B3: 9; B4: 8"></textarea>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-52 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Plano macro por bimestre (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const numEl = mustGet(root, '[data-field="num"]');
      const pesosEl = mustGet(root, '[data-field="pesos"]');
      const semanasEl = mustGet(root, '[data-field="semanas"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      numEl.value = state.bim?.num || '';
      pesosEl.value = state.bim?.pesos || '';
      semanasEl.value = state.bim?.semanas || '';
      outputEl.value = state.bim?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        ctx.storage.write({
          ...ctx.storage.read(),
          bim: { num: numEl.value || '', pesos: pesosEl.value || '', semanas: semanasEl.value || '', rawJson: outputEl.value || '' }
        });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';
          const prompt = `Retorne APENAS um JSON válido.
Gere um plano macro por bimestre considerando:
numBimestres=${numEl.value}
pesos=${pesosEl.value}
semanas=${semanasEl.value}
Calcular semanas úteis se necessário a partir do calendário informado anteriormente.
Schema sugerido:
{"numeroBimestres": 4, "plano": [{"bimestre":1,"semanas":0,"metas":["string"],"marcos":["string"]}]}`
          ;

          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';
          const parsed = json || (extractJson(String(text)).success ? extractJson(String(text)).data : null);
          if (!parsed) throw new Error('Não foi possível extrair JSON');
          const validated = validateGeneric(parsed);
          if (!validated.ok) throw new Error(validated.errors.join('; '));
          outputEl.value = JSON.stringify(validated.value, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), bim: { num: numEl.value || '', pesos: pesosEl.value || '', semanas: semanasEl.value || '', rawJson: outputEl.value } });
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

export default SubabaBimestres;
