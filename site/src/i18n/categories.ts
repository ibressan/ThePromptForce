export interface Category {
  slug: string;
  label: string;
}

// Matches the fixed topic headings the prompt (prompt.py) instructs Gemini to
// use — identical in both the PT and EN sections, so a single label works
// for extracting either language's content.
export const CATEGORIES: Category[] = [
  { slug: 'apex', label: 'Apex' },
  { slug: 'lwc', label: 'LWC' },
  { slug: 'data-cloud', label: 'Data Cloud' },
  { slug: 'flow', label: 'Flow' },
  { slug: 'admin', label: 'Admin' },
  { slug: 'ai-agentforce', label: 'AI & Agentforce' },
];
