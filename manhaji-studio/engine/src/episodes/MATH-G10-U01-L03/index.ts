import type {EpisodeModule} from '../../kit/Episode';
import type {Timeline} from '../../timeline/resolve';
import previewTimeline from './timeline.preview.json';
import {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11} from './scenes';

export const episode: EpisodeModule = {
  id: 'MATH-G10-U01-L03',
  meta: {subject_ar: 'رياضيات', grade_ar: 'أول ثانوي', lesson_ar: 'العبارات الشرطية'},
  theme: 'light',
  scenes: {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11},
  previewTimeline: previewTimeline as unknown as Timeline,
};
