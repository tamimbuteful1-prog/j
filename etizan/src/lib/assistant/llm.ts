/**
 * جاهز للربط مع LLM (مثل Claude) عبر خادم وسيط — لا تضع مفتاح API في المتصفح.
 *
 * المطلوب من الخادم (مثال: POST /api/assistant):
 *   body: { text, summary }  ← summary = computeMonth(...) مختصر
 *   يرد بـ Intent بصيغة JSON مطابقة لنوع Intent في parser.ts
 *
 * الاستخدام: setBrain(createLlmBrain('/api/assistant')) في store.ts
 * وإذا فشل الطلب نرجع للمحلل المحلي تلقائيًا.
 */
import type { AssistantBrain } from './brain';
import { parse, type Intent } from './parser';
import { computeMonth } from '../finance/engine';

export const INTENT_SCHEMA_HINT = `أرجع JSON واحد فقط من الأنواع:
{"type":"add_expense","items":[{"amount":number,"category":"fuel|groceries|electricity|maintenance|home|other","note"?:string}]}
{"type":"add_uber","amount":number}
{"type":"correct_last","amount":number}
{"type":"edit_target","target":"uber|fuel|groceries|electricity|maintenance|home|other","amount":number}
{"type":"delete_last"} | {"type":"delete_target","target":...} | {"type":"undo"}
{"type":"query","topic":"close|available|uber|expenses|loan|upcoming|summary|forecast|coverage|electricity|month|help","period"?:"today|week|month"}
{"type":"clarify","amount":number} | {"type":"unknown"}`;

export function createLlmBrain(endpoint: string): AssistantBrain {
  return {
    async understand(text, { data, today }) {
      try {
        const s = computeMonth(data, today);
        const { days: _days, ...summary } = s;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text, summary, schema: INTENT_SCHEMA_HINT }),
        });
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as Intent;
      } catch {
        return parse(text);
      }
    },
  };
}
