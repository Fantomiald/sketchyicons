import { Container, Muted, render, Text, Textbox, VerticalSpace } from '@create-figma-plugin/ui';
import { emit } from '@create-figma-plugin/utilities';
import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import rawBundle from './generated/icons.json';
import { searchIcons, type SearchIndex } from './search';
import type { Bundle, InsertIconHandler } from './types';

const bundle = rawBundle as Bundle;
const index: SearchIndex = { names: Object.keys(bundle.icons).sort(), aliases: bundle.aliases };
const RESULT_LIMIT = 60;

// The preview follows Figma's UI theme; the inserted icon stays solid ink.
const PREVIEW_STROKE = /stroke="#17130e"/;
const previewOf = (name: string) =>
  (bundle.icons[name] ?? '').replace(PREVIEW_STROKE, 'stroke="currentColor"');

function Plugin() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchIcons(index, query, RESULT_LIMIT), [query]);

  function insert(name: string) {
    emit<InsertIconHandler>('INSERT_ICON', name);
  }

  return (
    <Container space="medium">
      <VerticalSpace space="small" />
      <Textbox onValueInput={setQuery} placeholder="Search icons" value={query} />
      <VerticalSpace space="small" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
          gap: '4px',
        }}
      >
        {results.map((name) => (
          <button
            key={name}
            title={name}
            onClick={() => insert(name)}
            style={{
              boxSizing: 'border-box',
              width: '32px',
              height: '32px',
              padding: '4px',
              border: 'none',
              background: 'transparent',
              color: 'var(--figma-color-text)',
              cursor: 'pointer',
            }}
            dangerouslySetInnerHTML={{ __html: previewOf(name) }}
          />
        ))}
      </div>
      {results.length === 0 ? (
        <Text>
          <Muted>No icon matches that search.</Muted>
        </Text>
      ) : null}
      {results.length === RESULT_LIMIT ? (
        <Text>
          <Muted>Showing the first {RESULT_LIMIT} matches. Refine your search for more.</Muted>
        </Text>
      ) : null}
    </Container>
  );
}

export default render(Plugin);
