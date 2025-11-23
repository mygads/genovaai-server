# Intelligent Prompt System - GenovaAI

## Overview
GenovaAI menggunakan sistem prompt dinamis yang mengikuti prompt engineering best practices untuk membantu LLM memahami konteks dengan lebih baik. Sistem ini mendukung berbagai mode jawaban dan custom prompt untuk fleksibilitas maksimal.

## Fitur Utama

### 1. Answer Modes (Mode Jawaban)

Sistem menyediakan 4 mode jawaban yang mengontrol format dan panjang response:

#### Single Mode - Jawaban Langsung
- **Format**: Hanya huruf/jawaban tanpa penjelasan
- **Multiple Choice**: `A`
- **True/False**: `True` atau `False`
- **Short Answer**: `[jawaban 1-3 kata]`
- **Use Case**: Quick quiz, flashcards, latihan cepat

#### Short Mode - Jawaban + Penjelasan Singkat
- **Format**: `A. Penjelasan singkat`
- **Multiple Choice**: `A. Alasan singkat mengapa benar`
- **True/False**: `True. Alasan singkat`
- **Short Answer**: `[1-2 kalimat penjelasan]`
- **Use Case**: Quiz standar, homework help

#### Medium Mode - Jawaban + Penjelasan 5-10 Kata
- **Format**: `A. Ini benar karena [penjelasan 5-10 kata]`
- **Multiple Choice**: `A. Ini benar karena alasan dengan 5-10 kata penjelasan`
- **True/False**: `True. Penjelasan 5-10 kata dengan reasoning jelas`
- **Short Answer**: `[3-5 kalimat dengan penjelasan lengkap]`
- **Use Case**: Study session, concept review

#### Long Mode - Jawaban + Penjelasan Detail Lengkap
- **Format**: `Jawaban yang benar adalah A. [Penjelasan]. Alasannya adalah [reasoning detail]`
- **Multiple Choice**: Menjelaskan jawaban benar + kenapa opsi lain salah
- **Essay**: Multiple paragraphs dengan intro, body, conclusion
- **Short Answer**: Penjelasan lengkap dengan contoh
- **Use Case**: Exam prep, deep learning, essay questions

### 2. Tipe Soal yang Didukung

1. **Multiple Choice (A/B/C/D)**: Soal pilihan ganda dengan 4 opsi
2. **True/False**: Soal benar/salah
3. **Short Answer**: Pertanyaan singkat tanpa pilihan
4. **No Options**: Soal tanpa pilihan ABCD
5. **Essay**: Essay singkat atau panjang

### 3. Custom Prompt

User dapat membuat custom system prompt sendiri untuk kontrol penuh:

- Disimpan di database (`customSystemPrompt` field)
- Saat aktif (`useCustomPrompt = true`):
  - Button single/short/medium/long **TIDAK MUNCUL**
  - Sistem menggunakan custom prompt langsung
  - Knowledge base tetap digabungkan
  - Format request: `Custom Prompt + Knowledge + Pertanyaan User`

## Struktur Prompt Engineering

Sistem mengikuti struktur prompt engineering best practices:
```xml
<role>
You are GenovaAI, an intelligent quiz and study assistant...
</role>

<instructions>
1. Answer questions accurately based on the knowledge base
2. Provide clear and concise answers
3. Focus on educational value
4. Use knowledge base as primary reference
</instructions>

<constraints>
[Mode-specific constraints - e.g., for 'single' mode:]
1. Provide ONLY the answer without explanation
2. For multiple choice: respond with only the letter
3. No punctuation or additional text
</constraints>

<output_format>
[Mode-specific format - e.g., "Single answer only (letter, word, or phrase)"]
</output_format>

<behavior>
- Use knowledge base as primary reference
- State clearly if question cannot be answered
- Prioritize accuracy over elaboration
- Maintain helpful and educational tone
</behavior>
```

### Knowledge Context Format
```xml
<knowledge_base>
[Manual knowledge context entered by user]
</knowledge_base>

<uploaded_files>
File 1: document.pdf (pdf)
[Extracted text from PDF...]

---

File 2: notes.docx (docx)
[Extracted text from DOCX...]
</uploaded_files>
```

### User Question Format
```xml
<examples>
Example 1:
Question: What is the capital of France?
Answer: Paris

Example 2:
Question: What is 2+2?
Answer: 4
</examples>

<format_instructions>
[Optional custom output format specification]
</format_instructions>

<task>
Based on the context provided above, answer the following question:

[User's actual question]
</task>
```

## Prompt Flow

### Default Prompt Flow
1. User selects answer mode (single/short/medium/long)
2. System generates structured prompt using `buildSystemPrompt(answerMode)`
3. Knowledge context is formatted using `formatKnowledgeContext()`
4. User question is formatted using `formatUserQuestion()`
5. Final request: System Prompt + Knowledge Context + User Question

### Custom Prompt Flow
1. User creates custom prompt via API
2. System stores in `customSystemPrompt` field
3. User enables custom prompt (`useCustomPrompt = true`)
4. When processing request:
   - System uses `customSystemPrompt` directly
   - Skips answer mode prompt generation
   - Still includes knowledge context + user question

## Advanced Features

### 1. Context Caching
Reduces costs for repeated requests with large knowledge bases.

```typescript
getCachingConfig(model: string, contextLength: number): {
  enabled: boolean;
  minTokens: number;
  ttlSeconds: number;
}
```

**Minimum Token Requirements:**
- Gemini 3 Pro Preview: 2048 tokens
- Gemini 2.5 Pro: 4096 tokens
- Gemini 2.5 Flash: 1024 tokens
- Gemini 2.5 Flash Lite: 1024 tokens
- Gemini 2.0 Flash: 1024 tokens

**TTL**: 3600 seconds (1 hour)

### 2. Thinking Configuration
Optimizes model reasoning based on answer mode complexity.

```typescript
getThinkingConfig(model: string, answerMode: string): {
  thinkingLevel?: 'low' | 'high';
  thinkingBudget?: number;
}
```

**Gemini 3 Models (thinkingLevel):**
- `single` / `short`: `low` (faster responses)
- `medium` / `long`: `high` (better reasoning)

**Gemini 2.5 Models (thinkingBudget):**
- `single`: 0 tokens (no thinking)
- `short`: 4096 tokens
- `medium` / `long`: 8192 tokens

## API Endpoints

### 1. Set/Update Custom Prompt
```http
PUT /api/customer/genovaai/sessions/{sessionId}/custom-prompt
Content-Type: application/json
Authorization: Bearer {token}

{
  "customSystemPrompt": "You are an expert mathematics tutor...",
  "useCustomPrompt": true
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "sess_xxx",
    "sessionId": "sess_xxx",
    "sessionName": "Math Session",
    "customSystemPrompt": "You are an expert...",
    "useCustomPrompt": true,
    "answerMode": "medium"
  }
}
```

### 2. Remove Custom Prompt
```http
DELETE /api/customer/genovaai/sessions/{sessionId}/custom-prompt
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "sess_xxx",
    "customSystemPrompt": null,
    "useCustomPrompt": false,
    "systemPrompt": "You are a helpful quiz assistant."
  },
  "message": "Custom prompt removed, reverted to default system prompt"
}
```

### 3. Get Custom Prompt Configuration
```http
GET /api/customer/genovaai/sessions/{sessionId}/custom-prompt
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "sess_xxx",
    "sessionId": "sess_xxx",
    "sessionName": "Quiz Session",
    "customSystemPrompt": null,
    "useCustomPrompt": false,
    "answerMode": "short",
    "systemPrompt": "You are a helpful quiz assistant."
  }
}
```

## Service Layer Changes

### LLMGatewayService Updates

**Modified `processRequest()` Method:**
```typescript
// Build system prompt based on session configuration
let systemPrompt: string;
if (session.useCustomPrompt && session.customSystemPrompt) {
  // Use custom prompt directly
  systemPrompt = session.customSystemPrompt;
} else {
  // Generate structured prompt based on answer mode
  systemPrompt = buildSystemPrompt(
    session.answerMode as 'single' | 'short' | 'medium' | 'long'
  );
}

// Format knowledge context
const formattedKnowledge = formatKnowledgeContext(
  manualKnowledge, 
  fileContents
);

// Get optimization configs
const cachingConfig = getCachingConfig(model, knowledgeLength);
const thinkingConfig = getThinkingConfig(model, answerMode);
```

**Modified `callGemini()` Method:**
```typescript
// Build structured prompt parts
const parts: Array<{ text: string }> = [];

// 1. Knowledge context first
if (knowledge) {
  parts.push({ text: knowledge });
}

// 2. Format user question with examples and output format
const formattedQuestion = formatUserQuestion(
  question, 
  fewShotExamples, 
  outputFormat
);
parts.push({ text: formattedQuestion });

// Generation config with thinking
const generationConfig = {
  temperature: model.includes('gemini-3') ? 1.0 : 0.7,
  maxOutputTokens: 2048,
  thinkingConfig: thinkingConfig,
};

// System instruction with caching
const systemInstruction = { 
  parts: [{ text: systemPrompt }],
  cachedContent: cachingConfig.enabled ? {...} : undefined
};
```

## Quiz-Specific Formats

The system provides optimized formats for different quiz question types:

### Multiple Choice
- **Single**: `A`
- **Short**: `A. Brief reason why it's correct.`
- **Medium**: `A. This is correct because [2-3 sentence explanation].`
- **Long**: `A. [Detailed explanation]. B is incorrect because [reason]. C is incorrect because [reason].`

### True/False
- **Single**: `True`
- **Short**: `True. Brief justification.`
- **Medium**: `True. [2-3 sentence reasoning with context].`
- **Long**: `True. [Comprehensive explanation with examples].`

### Short Answer
- **Single**: `[1-3 words]`
- **Short**: `[1-2 sentences]`
- **Medium**: `[2-4 sentences with key points]`
- **Long**: `[Comprehensive answer with multiple paragraphs]`

### Essay
- **Single**: Not applicable
- **Short**: `[2-3 sentences]`
- **Medium**: `[1 paragraph, 4-6 sentences]`
- **Long**: `[Multiple paragraphs with intro, body, conclusion]`

## Migration Notes

### Deprecated Features
- **Static Templates** (`PROMPT_TEMPLATES`): Replaced with dynamic generation
- **Template API** (`/api/customer/genovaai/prompt-templates`): Now returns info about answer modes
- **`promptTemplateId` in session creation**: Removed from schema

### Backward Compatibility
- Existing sessions continue to work with default `systemPrompt` field
- Template API endpoint still exists but returns deprecation notice
- Session creation without custom prompt uses dynamic generation

## Best Practices

### 1. Answer Mode Selection
- **Single**: For quick quizzes, flashcards, rapid testing
- **Short**: For standard quiz practice, homework help
- **Medium**: For study sessions, concept review
- **Long**: For exam preparation, deep learning, essay questions

### 2. Custom Prompts
- Use for specialized domains (e.g., medical, legal, technical)
- Include specific terminology and context
- Define clear output expectations
- Maintain educational tone and accuracy requirements

### 3. Knowledge Base Integration
- Always provide relevant context for better answers
- Upload supporting documents (PDFs, DOCX)
- Use manual knowledge context for quick references
- Combine both for comprehensive coverage

### 4. Performance Optimization
- Enable caching for large knowledge bases (>1000 words)
- Use appropriate thinking levels for answer complexity
- Choose efficient models (Flash for speed, Pro for quality)

## Implementation Checklist

✅ Database schema updated with custom prompt fields  
✅ Prompt builder utility created (`src/lib/prompt-templates.ts`)  
✅ LLM gateway service updated to use dynamic prompts  
✅ Caching and thinking configuration implemented  
✅ Custom prompt API endpoints created  
✅ Prisma client regenerated  
✅ Build successful (50 routes compiled)  
✅ Backward compatibility maintained  

## Testing Recommendations

1. **Answer Mode Testing**:
   - Test each mode (single/short/medium/long) with sample questions
   - Verify response format matches expected output
   - Check token usage and response times

2. **Custom Prompt Testing**:
   - Create session with custom prompt
   - Verify custom prompt overrides default
   - Test knowledge integration with custom prompts
   - Confirm removal reverts to default

3. **Performance Testing**:
   - Test caching with large knowledge bases
   - Verify thinking config reduces/improves quality
   - Measure response times across answer modes

4. **Edge Cases**:
   - Empty knowledge base
   - Very long custom prompts (>5000 chars)
   - Multiple file uploads (>10 files)
   - Mixed question types in same session

## Future Enhancements

- [ ] Prompt templates UI in admin dashboard
- [ ] A/B testing for prompt effectiveness
- [ ] User-specific prompt libraries
- [ ] Prompt versioning and rollback
- [ ] Analytics on answer mode usage
- [ ] Automatic mode suggestion based on question type
- [ ] Multi-language prompt support
- [ ] Prompt marketplace for sharing
