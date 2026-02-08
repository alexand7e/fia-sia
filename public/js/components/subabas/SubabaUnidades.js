import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateGeneric } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaUnidades(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Unidades</h2>
            <p class="text-sm text-slate-500">Quebre cada bimestre em unidades com objetivos e resultados.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Bimestre</label>
              <input data-field="bimestre" type="number" min="1" max="4" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: 1" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Duração estimada (semanas)</label>
              <input data-field="duracao" type="number" min="1" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: 4" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold mb-1">Tópicos e objetivos</label>
              <textarea data-field="topicos" class="w-full h-24 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Descreva temas e objetivos"></textarea>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-56 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Unidades geradas (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const bimestreEl = mustGet(root, '[data-field="bimestre"]');
      const duracaoEl = mustGet(root, '[data-field="duracao"]');
      const topicosEl = mustGet(root, '[data-field="topicos"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      bimestreEl.value = state.uni?.bimestre || '';
      duracaoEl.value = state.uni?.duracao || '';
      topicosEl.value = state.uni?.topicos || '';
      outputEl.value = state.uni?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        ctx.storage.write({
          ...ctx.storage.read(),
          uni: { bimestre: bimestreEl.value || '', duracao: duracaoEl.value || '', topicos: topicosEl.value || '', rawJson: outputEl.value || '' }
        });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';
          const prompt = `Retorne APENAS um JSON válido.
Gere 1–3 unidades para o bimestre ${bimestreEl.value}, com duração estimada ${duracaoEl.value} semanas.
Tópicos/objetivos informados:
${topicosEl.value}
Schema sugerido:
{"bimestre": ${Number(bimestreEl.value || 1)}, "unidades":[{"titulo":"string","duracaoSemanas":1,"objetivos":["string"],"resultados":["string"]}]}`
          ;
          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';
          const extracted = json ? { success: true, data: json } : extractJson(String(text));
          if (!extracted.success) throw extracted.error;
          const validated = validateGeneric(extracted.data);
          if (!validated.ok) throw new Error(validated.errors.join('; '));
          outputEl.value = JSON.stringify(validated.value, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), uni: { bimestre: bimestreEl.value || '', duracao: duracaoEl.value || '', topicos: topicosEl.value || '', rawJson: outputEl.value } });
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

export default SubabaUnidades;
