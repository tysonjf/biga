import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Node } from '@tiptap/pm/model';
import { mathAnswers } from './NotesMath';

const schema = getSchema([StarterKit, TaskList, TaskItem]);
const text = (t: string) => ({ type: 'text', text: t });
const para = (...content: object[]) => ({ type: 'paragraph', content });
const doc = (...content: object[]) => Node.fromJSON(schema, { type: 'doc', content });

describe('sums in the notes', () => {
  it('puts the answer at the end of the line', () => {
    const d = doc(para(text('Divide into 4 x 280 =')));
    expect(mathAnswers(d, {})).toEqual([{ pos: 1 + 'Divide into 4 x 280 ='.length, text: '1120' }]);
  });

  it('treats each line of a paragraph on its own', () => {
    const d = doc(para(text('2 + 2 ='), { type: 'hardBreak' }, text('10 / 4 =')));
    // 1 (into the paragraph) + 7 chars, then the break (1) and 8 more chars.
    expect(mathAnswers(d, {})).toEqual([
      { pos: 8, text: '4' },
      { pos: 17, text: '2.5' },
    ]);
  });

  it('works in headings, lists and checklists, across bold text, with the recipe’s amounts', () => {
    const d = doc(
      { type: 'heading', attrs: { level: 2 }, content: [text('Salt: flour × 2.5% =')] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [para(text('4 x '), { ...text('280'), marks: [{ type: 'bold' }] }, text(' ='))] }] },
      { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [para(text('water / 2 ='))] }] },
      para(text('No sum here')),
    );
    expect(mathAnswers(d, { flour: 1000, water: 700 }).map((a) => a.text)).toEqual(['25', '1120', '350']);
  });
});
