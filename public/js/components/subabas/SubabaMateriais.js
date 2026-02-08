import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateGeneric } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaMateriais(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Materiais</h2>
            <p class="text-sm text-slate-500">Liste e gere materiais por unidade/aula.</p>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Lista de materiais/recursos</label>
            <textarea data-field="lista" class="w-full h-24 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Slides, roteiros, exercícios, adaptações..."></textarea>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-56 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Sugestões de materiais (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const listaEl = mustGet(root, '[data-field="lista"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      listaEl.value = state.mat?.lista || '';
      outputEl.value = state.mat?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        ctx.storage.write({ ...ctx.storage.read(), mat: { lista: listaEl.value || '', rawJson: outputEl.value || '' } });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';
          const prompt = `Retorne APENAS um JSON válido.
Sugira materiais a partir da lista:
${listaEl.value}
Schema sugerido:
{"materiais":[{"unidade":"string","itens":[{"tipo":"string","descricao":"string"}]}]}`
          ;
          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';
          const extracted = json ? { success: true, data: json } : extractJson(String(text));
          if (!extracted.success) throw extracted.error;
          const validated = validateGeneric(extracted.data);
          if (!validated.ok) throw new Error(validated.errors.join('; '));
          outputEl.value = JSON.stringify(validated.value, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), mat: { lista: listaEl.value || '', rawJson: outputEl.value } });
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

export default SubabaMateriais;
