// ── Extra feature: Resume ↔ JD keyword match % ────────────────
// Pure client-side set overlap of meaningful tokens — no models, no
// network. Marked clearly as an addition beyond the core PRD spec.

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'are', 'will', 'have',
  'has', 'this', 'that', 'from', 'they', 'their', 'all', 'can', 'who', 'into',
  'job', 'role', 'work', 'team', 'years', 'year', 'experience', 'we', 'a', 'an',
  'to', 'of', 'in', 'on', 'as', 'at', 'is', 'be', 'or', 'by', 'it', 'its',
  'should', 'must', 'using', 'use', 'including', 'etc', 'per', 'across',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#. ]/g, ' ')
      .split(/\s+/)
      .map((t) => t.replace(/^\.+|\.+$/g, ''))
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t)),
  );
}

export interface MatchResult {
  score: number;          // 0–100
  matched: string[];      // keywords present in both
  missing: string[];      // notable JD keywords absent from resume
}

export function keywordMatch(jdText?: string, resumeText?: string): MatchResult | null {
  if (!jdText || !resumeText) return null;
  const jd = tokenize(jdText);
  const resume = tokenize(resumeText);
  if (jd.size === 0) return null;

  const matched: string[] = [];
  const missing: string[] = [];
  jd.forEach((token) => {
    if (resume.has(token)) matched.push(token);
    else missing.push(token);
  });

  const score = Math.round((matched.length / jd.size) * 100);
  return {
    score,
    matched: matched.sort().slice(0, 40),
    missing: missing.sort().slice(0, 40),
  };
}
