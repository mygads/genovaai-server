/**
 * Dynamic Prompt Builder for GenovaAI
 * Generates structured system prompts following prompt engineering best practices
 */

/**
 * Generate structured system prompt based on answer mode
 * Follows prompt engineering pattern: Role → Instructions → Constraints → Output Format
 */
export function buildSystemPrompt(answerMode: 'single' | 'short' | 'medium' | 'long'): string {
  const role = 'You are Genova AI, an intelligent quiz and study assistant designed to help students learn effectively.';

  const baseInstructions = [
    'Answer questions accurately based on the provided knowledge base and context.',
    'For quiz questions (multiple choice, true/false, essay), provide clear and concise answers.',
    'Focus on educational value and helping students understand the material.',
    'Use the knowledge base as your primary source of information.',
  ];

  let constraints: string[] = [];
  let outputFormat = '';

  // Customize based on answer mode
  switch (answerMode) {
    case 'single':
      constraints = [
        'Provide ONLY the answer letter or option without any explanation.',
        'For multiple choice (A/B/C/D): respond with ONLY the letter. Example: "A"',
        'For true/false: respond with only "True" or "False"',
        'For short answer questions: provide only the direct answer (1-3 words)',
        'For essay questions: this mode is not applicable, use short mode instead',
        'Do not include any punctuation, explanations, reasoning, or additional text.',
      ];
      outputFormat = 'Format: Just the answer letter/option. Example: A';
      break;

    case 'short':
      constraints = [
        'Provide the answer with brief explanation.',
        'For multiple choice: format as "A. Penjelasan singkat" (answer letter + brief explanation)',
        'For true/false: format as "True. Alasan singkat" or "False. Alasan singkat"',
        'For short answer: provide concise response (1-2 sentences)',
        'For essay: provide brief summary (2-3 sentences)',
        'Keep explanations very brief and to the point.',
      ];
      outputFormat = 'Format: A. Penjelasan singkat (answer + brief reason)';
      break;

    case 'medium':
      constraints = [
        'Provide the answer with moderate explanation.',
        'For multiple choice: format as "A. Ini benar karena [penjelasan 2-3 kalimat]"',
        'For true/false: provide answer with clear reasoning (2-3 sentences)',
        'For short answer: give complete explanation (3-5 sentences)',
        'For essay: provide structured response (1 paragraph)',
        'Include key concepts and reasoning.',
        'Aim for 5-10 kata penjelasan for medium length.',
      ];
      outputFormat = 'Format: A. Ini benar karena [penjelasan 5-10 kata]';
      break;

    case 'long':
      constraints = [
        'Provide comprehensive answer with detailed explanation.',
        'For multiple choice: format as "Jawaban yang benar adalah A. [Penjelasan detail]. Alasannya adalah [reasoning lengkap]"',
        'Explain WHY the correct answer is right.',
        'Explain WHY other options are incorrect (if applicable).',
        'For essay: provide well-structured response with multiple paragraphs.',
        'For short answer: give thorough explanation with examples.',
        'Include context, examples, and connections to concepts.',
        'Use clear, educational language.',
      ];
      outputFormat = 'Format: Jawaban yang benar adalah A. [Penjelasan]. Alasannya adalah [reasoning detail lengkap]';
      break;
  }

  // Build structured prompt with XML-style tags for clarity
  return `<role>
${role}
</role>

<instructions>
${baseInstructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}
</instructions>

<constraints>
${constraints.map((con, i) => `${i + 1}. ${con}`).join('\n')}
</constraints>

<output_format>
${outputFormat}
</output_format>

<behavior>
- If a knowledge base is provided, use it as your primary reference.
- If the question cannot be answered from the knowledge base, state this clearly.
- For quiz questions, prioritize accuracy over elaboration.
- Maintain a helpful and educational tone.
- Never make up information - only use what's in the context or your training.
</behavior>`;
}

/**
 * Format knowledge context with proper structure
 * Combines manual context and uploaded files into single knowledge block
 */
export function formatKnowledgeContext(
  manualContext: string | null,
  fileContents: string | null
): string {
  if (!manualContext && !fileContents) {
    return '';
  }

  let formatted = '';

  if (manualContext) {
    formatted += '<knowledge_base>\n';
    formatted += manualContext;
    formatted += '\n</knowledge_base>\n\n';
  }

  if (fileContents) {
    formatted += '<uploaded_files>\n';
    formatted += fileContents;
    formatted += '\n</uploaded_files>\n\n';
  }

  return formatted;
}

/**
 * Format user question with optional few-shot examples and output format
 */
export function formatUserQuestion(
  question: string,
  fewShotExamples?: Array<{ question: string; answer: string }>,
  outputFormat?: string
): string {
  let formatted = '';

  // Add few-shot examples if provided
  if (fewShotExamples && fewShotExamples.length > 0) {
    formatted += '<examples>\n';
    fewShotExamples.forEach((example, index) => {
      formatted += `Example ${index + 1}:\n`;
      formatted += `Question: ${example.question}\n`;
      formatted += `Answer: ${example.answer}\n\n`;
    });
    formatted += '</examples>\n\n';
  }

  // Add custom output format if provided
  if (outputFormat) {
    formatted += `<format_instructions>\n${outputFormat}\n</format_instructions>\n\n`;
  }

  // Add the actual question
  formatted += '<task>\n';
  formatted += `${question}\n`;
  formatted += '</task>';

  return formatted;
}

/**
 * Get thinking config based on model and answer mode
 * - Gemini 3 models use thinkingLevel (low/high)
 * - Gemini 2.5 models use thinkingBudget (token count)
 */
export function getThinkingConfig(
  model: string,
  answerMode: 'single' | 'short' | 'medium' | 'long'
): {
  thinkingLevel?: 'low' | 'high';
  thinkingBudget?: number;
} {
  // Gemini 3 models use thinkingLevel
  if (model.includes('gemini-3')) {
    // Use low thinking for single/short answers (faster response)
    // Use high thinking for medium/long answers (better reasoning)
    return {
      thinkingLevel: answerMode === 'single' || answerMode === 'short' ? 'low' : 'high',
    };
  }

  // Gemini 2.5 models use thinkingBudget
  if (model.includes('gemini-2.5')) {
    // Disable thinking for simple single answers (no thinking needed)
    // Enable thinking for more complex responses (better quality)
    if (answerMode === 'single') {
      return { thinkingBudget: 0 };
    } else if (answerMode === 'short') {
      return { thinkingBudget: 4096 };
    } else {
      return { thinkingBudget: 8192 };
    }
  }

  return {};
}

/**
 * Get caching config based on model and context size
 * Caching reduces costs for repeated requests with large knowledge bases
 */
export function getCachingConfig(
  model: string,
  contextLength: number
): {
  enabled: boolean;
  minTokens: number;
  ttlSeconds: number;
} {
  // Estimate tokens (rough: 1 token ≈ 4 characters)
  const estimatedTokens = Math.floor(contextLength / 4);

  // Minimum tokens required for caching per model
  const minTokenLimits: Record<string, number> = {
    'gemini-3-pro-preview': 2048,
    'gemini-2.5-pro': 4096,
    'gemini-2.5-flash': 1024,
    'gemini-2.5-flash-lite': 1024,
    'gemini-2.0-flash': 1024,
    'gemini-1.5-pro': 4096,
    'gemini-1.5-flash': 1024,
  };

  // Find matching model key
  const modelKey = Object.keys(minTokenLimits).find((key) => model.includes(key));
  const minTokens = modelKey ? minTokenLimits[modelKey] : 4096;

  return {
    enabled: estimatedTokens >= minTokens,
    minTokens,
    ttlSeconds: 3600, // 1 hour TTL for cached content
  };
}

/**
 * Quiz answer format examples for different question types and modes
 */
export const QuizAnswerFormats = {
  multipleChoice: {
    single: 'A',
    short: 'A. Penjelasan singkat',
    medium: 'A. Ini benar karena alasan dengan 5-10 kata penjelasan',
    long: 'Jawaban yang benar adalah A. Penjelasan detail lengkap. Alasannya adalah [reasoning]. Opsi B salah karena [alasan]. Opsi C salah karena [alasan].',
  },
  trueFalse: {
    single: 'True',
    short: 'True. Alasan singkat',
    medium: 'True. Ini benar karena penjelasan 5-10 kata dengan reasoning yang jelas',
    long: 'Jawaban yang benar adalah True. Penjelasan lengkap dengan contoh dan koneksi ke konsep lain.',
  },
  shortAnswer: {
    single: '[jawaban singkat 1-3 kata]',
    short: '[1-2 kalimat penjelasan]',
    medium: '[3-5 kalimat dengan penjelasan lengkap]',
    long: '[Penjelasan detail dengan contoh dan struktur yang jelas]',
  },
  essay: {
    single: 'Tidak berlaku untuk essay',
    short: '[2-3 kalimat ringkasan]',
    medium: '[1 paragraf dengan 5-7 kalimat terstruktur]',
    long: '[Beberapa paragraf dengan intro, body, dan kesimpulan]',
  },
  noOptions: {
    single: '[jawaban langsung]',
    short: '[jawaban + penjelasan singkat]',
    medium: '[jawaban + penjelasan 5-10 kata]',
    long: '[jawaban + penjelasan detail lengkap dengan reasoning]',
  },
};
