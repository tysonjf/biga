// Rich-text notes, stored as Markdown. Loaded on demand (see Notes.tsx): it's the app's biggest
// dependency and only recipe and bake pages need it.

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';

export type NotesEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  editable: boolean;
  placeholder: string;
  label: string;
};

export default function NotesEditor({ value, onChange, editable, placeholder, label }: NotesEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // The Markdown the editor holds, so a new `value` can be told apart from our own edits coming back.
  const last = useRef(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: true, autolink: true, linkOnPaste: true, defaultProtocol: 'https' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editable,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { 'aria-label': label, 'aria-multiline': 'true', role: 'textbox', class: 'md' } },
    onUpdate: ({ editor }) => {
      last.current = editor.getMarkdown();
      onChangeRef.current(last.current);
    },
  });

  // Locking and unlocking doesn't change the text, so don't report it as an edit.
  useEffect(() => {
    if (editor.isEditable !== editable) editor.setEditable(editable, false);
  }, [editor, editable]);

  // Text replaced from outside (a template): load it without reporting it back as an edit.
  useEffect(() => {
    if (value === last.current) return;
    last.current = value;
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
  }, [editor, value]);

  return (
    <div className={'md-editor' + (editable ? ' editing' : '')}>
      {editable ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const on = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      undo: e.can().undo(),
      redo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();
  const buttons: { key: string; label: string; text: string; active?: boolean; disabled?: boolean; run: () => void; cls?: string }[] = [
    { key: 'h2', label: 'Heading', text: 'H', active: on.h2, run: () => chain().toggleHeading({ level: 2 }).run(), cls: 'h' },
    { key: 'h3', label: 'Subheading', text: 'h', active: on.h3, run: () => chain().toggleHeading({ level: 3 }).run(), cls: 'h3' },
    { key: 'bold', label: 'Bold', text: 'B', active: on.bold, run: () => chain().toggleBold().run(), cls: 'b' },
    { key: 'italic', label: 'Italic', text: 'I', active: on.italic, run: () => chain().toggleItalic().run(), cls: 'i' },
    { key: 'ordered', label: 'Numbered steps', text: '1.', active: on.ordered, run: () => chain().toggleOrderedList().run() },
    { key: 'bullet', label: 'Bullet list', text: '•', active: on.bullet, run: () => chain().toggleBulletList().run() },
    { key: 'task', label: 'Checklist', text: '☐', active: on.task, run: () => chain().toggleTaskList().run() },
    { key: 'undo', label: 'Undo', text: '↶', disabled: !on.undo, run: () => chain().undo().run(), cls: 'gap' },
    { key: 'redo', label: 'Redo', text: '↷', disabled: !on.redo, run: () => chain().redo().run() },
  ];
  return (
    <div className="md-toolbar" role="toolbar" aria-label="Formatting">
      {buttons.map((b) => (
        <button
          key={b.key}
          type="button"
          className={b.cls}
          aria-label={b.label}
          title={b.label}
          aria-pressed={b.active === undefined ? undefined : b.active}
          disabled={b.disabled}
          // Keep the keyboard up and the selection where it is.
          onMouseDown={(e) => e.preventDefault()}
          onClick={b.run}
        >
          {b.text}
        </button>
      ))}
    </div>
  );
}
