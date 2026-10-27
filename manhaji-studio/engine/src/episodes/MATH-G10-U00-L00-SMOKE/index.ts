import type {EpisodeModule} from '../../kit/Episode';
import type {Timeline} from '../../timeline/resolve';
import previewTimeline from './timeline.preview.json';
import {S01, S02, S03} from './scenes';

/** Pipeline smoke-test episode (not a lesson): proves resolve → render → media → final work end to end. */
export const episode: EpisodeModule = {
  id: 'MATH-G10-U00-L00-SMOKE',
  meta: {subject_ar: 'الرياضيات', grade_ar: 'أول ثانوي', lesson_ar: 'اختبار المحرك'},
  scenes: {S01, S02, S03},
  previewTimeline: previewTimeline as unknown as Timeline,
};
