export interface SearchIndex {
  names: string[];
  aliases: Record<string, string>;
}

export function searchIcons(index: SearchIndex, query: string, limit: number): string[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === '') return index.names.slice(0, limit);

  const aliasedTargets = new Set(
    Object.entries(index.aliases)
      .filter(([alias]) => alias.includes(trimmed))
      .map(([, target]) => target),
  );
  const found = index.names.filter((name) => name.includes(trimmed) || aliasedTargets.has(name));
  return found.slice(0, limit);
}
