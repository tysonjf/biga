// Sums in the notes: end a line with "=" and the answer shows after it ("4 x 280 = 1120"), worked
// out live like Apple Notes' Math Notes. The answer isn't part of the text, so it keeps up when the
// sum or the recipe changes, and the stored Markdown stays as written. Part of the notes editor's
// lazy chunk (see Notes.tsx).

import { Extension, markInputRule, markPasteRule } from '@tiptap/react';
import Italic from '@tiptap/extension-italic';
import type { Node } from '@tiptap/pm/model';
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { fmtNum, trailingMath, type Vars } from '../lib/math';

export const mathKey = new PluginKey<DecorationSet>('notesMath');

/** Where each answer goes (the end of its line) and what it says. */
export function mathAnswers(doc: Node, vars: Vars): { pos: number; text: string }[] {
  const out: { pos: number; text: string }[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // A hard break (Shift+Enter) starts a new line inside the paragraph.
    let line = '';
    const end = (at: number) => {
      const hit = trailingMath(line, vars);
      if (hit) out.push({ pos: at, text: fmtNum(hit.value) });
      line = '';
    };
    node.forEach((child, offset) => {
      if (child.type.name === 'hardBreak') end(pos + 1 + offset);
      else line += child.isText ? child.text : '￼';
    });
    end(pos + 1 + node.content.size);
    return false;
  });
  return out;
}

function decorations(doc: Node, vars: Vars) {
  return DecorationSet.create(
    doc,
    mathAnswers(doc, vars).map(({ pos, text }) =>
      Decoration.widget(
        pos,
        () => {
          const el = document.createElement('span');
          el.className = 'md-math';
          el.contentEditable = 'false';
          el.textContent = text;
          return el;
        },
        { side: 1, key: `math:${text}`, ignoreSelection: true },
      ),
    ),
  );
}

/** Tell the notes to work their sums out again, after the recipe's amounts change. */
export const refreshMath = (state: EditorState) => state.tr.setMeta(mathKey, true).setMeta('addToHistory', false);

export const NotesMath = Extension.create<{ vars: () => Vars }>({
  name: 'notesMath',
  addOptions: () => ({ vars: () => ({}) }),
  addProseMirrorPlugins() {
    const vars = this.options.vars;
    return [
      new Plugin<DecorationSet>({
        key: mathKey,
        state: {
          init: (_, state) => decorations(state.doc, vars()),
          apply: (tr, old) => (tr.docChanged || tr.getMeta(mathKey) ? decorations(tr.doc, vars()) : old),
        },
        props: { decorations: (state) => mathKey.getState(state) },
      }),
    ];
  },
});

// "*text*" only turns italic when the stars hug the text, as in Markdown itself. Tiptap's own rule
// also takes "2 * 4 *", which italicised the middle of a sum as you typed it.
const star = '(?:^|\\s)(\\*(?!\\s)([^*]*[^*\\s])\\*)';
const underscore = '(?:^|\\s)(_(?!\\s+_)((?:[^_]+))_(?!\\s+_))';

export const MathSafeItalic = Italic.extend({
  addInputRules() {
    return [new RegExp(star + '$'), new RegExp(underscore + '$')].map((find) => markInputRule({ find, type: this.type }));
  },
  addPasteRules() {
    return [new RegExp(star, 'g'), new RegExp(underscore, 'g')].map((find) => markPasteRule({ find, type: this.type }));
  },
});
