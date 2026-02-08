import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateGeneric } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaAvaliacoes(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Avaliações</h2>
            <p class="text-sm text-slate-500">Planeje instrumentos, pesos e critérios por bimestre.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Instrumentos</label>
              <input data-field="instrumentos" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Provas, trabalhos, rubricas..." />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Datas</label>
              <input data-field="datas" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: B1 P1 15/04; B2 P1 20/06..." />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-56 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Matriz avaliativa (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const instrumentosEl = mustGet(root, '[data-field="instrumentos"]');
      const datasEl = mustGet(root, '[data-field="datas"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      instrumentosEl.value = state.ava?.instrumentos || '';
      datasEl.value = state.ava?.datas || '';
      outputEl.value = state.ava?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        ctx.storage.write({
          ...ctx.storage.read(),
          ava: { instrumentos: instrumentosEl.value || '', datas: datasEl.value || '', rawJson: outputEl.value || '' }
        });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';
          const prompt = `Retorne APENAS um JSON válido.
Monte uma matriz de avaliação por bimestre usando:
instrumentos=${instrumentosEl.value}
datas=${datasEl.value}
Schema sugerido:
{"matriz":[{"bimestre":1,"itens":[{"tipo":"string","peso":0,"criterios":["string"]}]}]}`
          ;
          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';
          const extracted = json ? { success: true, data: json } : extractJson(String(text));
          if (!extracted.success) throw extracted.error;
          const validated = validateGeneric(extracted.data);
          if (!validated.ok) throw new Error(validated.errors.join('; '));
          outputEl.value = JSON.stringify(validated.value, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), ava: { instrumentos: instrumentosEl.value || '', datas: datasEl.value || '', rawJson: outputEl.value } });
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

export default SubabaAvaliacoes;
