/**
 * «عقل» المساعد — طبقة تجريدية.
 * الآن: RuleBasedBrain (محلي، بدون إنترنت).
 * لاحقًا: LlmBrain يرسل النص + ملخص الحالة إلى نموذج لغوي ويستلم Intent بنفس الشكل،
 * ثم يُنفَّذ بنفس runIntent — فلا يتغير شيء في الواجهة أو الحسابات.
 */
import type { Intent } from './parser';
import { parse } from './parser';
import type { AppData, ISODate } from '../types';

export interface AssistantBrain {
  understand(text: string, ctx: { data: AppData; today: ISODate }): Promise<Intent>;
}

export const ruleBasedBrain: AssistantBrain = {
  async understand(text) {
    return parse(text);
  },
};
