import { generateGemini } from './gemini';

/**
 * Builds a prompt asking Gemini to generate exactly 3 multiple-choice questions
 * based on the explained files and concepts.
 */
export function buildQuizPrompt({ explanations = [], files = {}, level = 'beginner' }) {
  const explanationSummary = explanations
    .map((e) => `File: ${e.path}\nPurpose: ${e.purpose}\nConcept: ${e.concept}`)
    .join('\n\n');

  const fileSnippets = Object.entries(files)
    .map(([path, content]) => `File: ${path}\n\`\`\`\n${content.slice(0, 1500)}\n\`\`\``)
    .join('\n\n');

  return `You are a friendly coding teacher creating a 3-question review quiz for a student learning to code (${level} level).

Here are the code files and concepts they just learned:
${explanationSummary}

Code context:
${fileSnippets}

Generate EXACTLY 3 multiple-choice questions testing their understanding of what was built, why certain lines/hooks were used, and the concepts involved.

Output ONLY a single raw JSON object matching this schema (NO markdown code fences, NO backticks, NO extra commentary):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}`;
}

/**
 * Validates the raw parsed quiz structure.
 */
function validateQuizSchema(obj) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.questions)) {
    return false;
  }
  if (obj.questions.length === 0) return false;

  for (const q of obj.questions) {
    if (!q.question || typeof q.question !== 'string') return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex >= q.options.length) return false;
    if (!q.explanation || typeof q.explanation !== 'string') return false;
  }

  return true;
}

/**
 * Parses JSON safely from model response, stripping any surrounding markdown code blocks.
 */
function cleanAndParseJSON(rawText) {
  if (!rawText) throw new Error('Empty response from model');

  // Strip ```json and ``` fences if present
  let clean = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Find first { and last }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(clean);
}

/**
 * Generates and validates a 3-question quiz with 1 automatic retry on JSON failure.
 */
export async function generateQuiz({ apiKey, model, explanations = [], files = {}, level = 'beginner' }) {
  const prompt = buildQuizPrompt({ explanations, files, level });
  const systemPrompt = 'You are an educational assessment assistant. Always respond with pure valid JSON only, without markdown formatting.';

  // Attempt 1
  try {
    const rawResult = await generateGemini({ apiKey, model, systemPrompt, prompt });
    const parsed = cleanAndParseJSON(rawResult);
    if (validateQuizSchema(parsed)) {
      return parsed.questions.slice(0, 3);
    }
  } catch (err1) {
    console.warn('[Quiz] Attempt 1 parse failed, retrying...', err1.message);
  }

  // Attempt 2 (Retry with strict instruction)
  try {
    const retryPrompt = prompt + '\n\nIMPORTANT: Return PURE JSON ONLY. Do not use markdown backticks.';
    const rawResult = await generateGemini({ apiKey, model, systemPrompt, prompt: retryPrompt });
    const parsed = cleanAndParseJSON(rawResult);
    if (validateQuizSchema(parsed)) {
      return parsed.questions.slice(0, 3);
    }
    throw new Error('Quiz response did not match expected structure.');
  } catch (err2) {
    throw new Error(`Failed to generate quiz: ${err2.message || 'Invalid format'}. Please try again.`);
  }
}
