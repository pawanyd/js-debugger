import { useEffect, useMemo, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';

// StateEffect to set the active line
const setActiveLine = StateEffect.define();

// StateField that manages active line decoration
const activeLineField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setActiveLine)) {
        const lineNum = effect.value;
        if (lineNum == null || lineNum < 1) {
          return Decoration.none;
        }
        try {
          const line = tr.state.doc.line(lineNum);
          const deco = Decoration.line({ class: 'active-line' }).range(line.from);
          return Decoration.set([deco]);
        } catch {
          return Decoration.none;
        }
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Custom theme for editor styling
const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.active-line': {
    backgroundColor: 'var(--highlight-line) !important',
    borderLeft: '3px solid var(--accent) !important',
  },
  '.cm-content': {
    caretColor: 'var(--accent)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent)',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--accent-light) !important',
  },
});

export default function CodeEditor({ code, onChange, activeLine, readOnly = false }) {
  const viewRef = useRef(null);

  const extensions = useMemo(
    () => [javascript(), activeLineField, editorTheme],
    []
  );

  const handleChange = useCallback(
    (value) => {
      if (onChange) onChange(value);
    },
    [onChange]
  );

  const handleCreateEditor = useCallback((view) => {
    viewRef.current = view;
  }, []);

  // Dispatch active line effect only when activeLine prop changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: setActiveLine.of(activeLine),
      });
    }
  }, [activeLine]);

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
      <CodeMirror
        value={code}
        onChange={handleChange}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        theme="dark"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: false,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          indentOnInput: true,
          tabSize: 2,
        }}
        onCreateEditor={handleCreateEditor}
        className="h-full text-sm"
      />
    </div>
  );
}
