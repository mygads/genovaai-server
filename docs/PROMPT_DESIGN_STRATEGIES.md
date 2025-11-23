# Prompt Design Strategies - GenovaAI

## Overview

Prompt design adalah proses membuat prompt atau natural language requests yang menghasilkan respons yang akurat dan berkualitas tinggi dari language model. Dokumen ini menyediakan panduan dan best practices untuk mendapatkan hasil terbaik dari Gemini models di GenovaAI.

> **Note**: Prompt engineering bersifat iteratif. Guidelines ini adalah starting point. Eksperimen dan refine berdasarkan use case spesifik Anda.

## Clear and Specific Instructions

Cara paling efektif untuk customize model behavior adalah memberikan instruksi yang jelas dan spesifik.

### Input Types

| Type | Description | Example |
|------|-------------|---------|
| **Question** | Pertanyaan yang model jawab | "What's a good name for a quiz app?" |
| **Task** | Tugas yang model lakukan | "Summarize this chapter in 3 points" |
| **Entity** | Entity yang model operasikan | "Classify: Biology, Chemistry, Physics" |
| **Completion** | Partial input yang model complete | "The quiz consists of..." |

### Example: Task Input

```
Give me a simple list of study topics for Computer Science final exam.
The list should have 5 items.
```

**Response:**
```
1. Data Structures (Arrays, Lists, Trees)
2. Algorithms (Sorting, Searching, Graph)
3. Object-Oriented Programming
4. Database Management Systems
5. Operating Systems Fundamentals
```

## System Instructions for GenovaAI

Di GenovaAI, setiap Extension Session memiliki System Prompt yang dapat dikonfigurasi. Gunakan ini untuk mengatur behavior model secara konsisten.

### Default System Prompts

**Quiz Assistant (Default):**
```
You are a helpful quiz assistant. Create clear, educational questions 
based on the provided material. Focus on key concepts and ensure 
questions are fair and unambiguous.
```

**Study Buddy:**
```
You are a friendly study companion. Help students understand concepts 
by explaining them clearly and providing relevant examples. Be 
encouraging and patient.
```

**Code Tutor:**
```
You are an expert programming tutor. Explain code concepts clearly, 
provide working examples, and help debug issues. Always write clean, 
well-commented code.
```

**Essay Helper:**
```
You are an academic writing assistant. Help create well-structured 
essays with clear arguments, proper citations, and coherent flow. 
Maintain academic tone.
```

## Response Format

Specify format yang jelas untuk response yang Anda inginkan.

### Format Examples

**Bulleted List:**
```
List the main causes of World War I.
Format: Bulleted list, 5 items maximum.
```

**Table Format:**
```
Compare Python and JavaScript.
Format: Table with columns: Feature, Python, JavaScript
```

**JSON Output:**
```
Extract key information from this text.
Output format: JSON with fields: topic, key_points, difficulty_level
```

**Multiple Choice:**
```
Create 5 multiple choice questions about photosynthesis.
Format: 
Question: [text]
A) [option]
B) [option]
C) [option]
D) [option]
Correct Answer: [letter]
```

## Zero-shot vs Few-shot Prompts

### Zero-shot (No Examples)

```
Classify this question difficulty: "What is 2+2?"
Options: easy, medium, hard
```

### Few-shot (With Examples) ✅ Recommended

```
Classify question difficulty:

Example 1:
Question: "What is the capital of France?"
Difficulty: easy

Example 2:
Question: "Explain quantum entanglement"
Difficulty: hard

Now classify:
Question: "What is photosynthesis?"
Difficulty:
```

**Response:** `medium`

### Best Practices for Few-shot

1. **Use 2-5 examples** - Optimal range untuk most tasks
2. **Show patterns, not anti-patterns** - Focus on what TO do
3. **Consistent formatting** - Keep structure sama across examples
4. **Varied examples** - Cover different scenarios

## Adding Context for GenovaAI

GenovaAI allows context melalui:
- **Knowledge Context**: Manual text input
- **Knowledge Files**: PDF, DOCX, TXT files
- **Session History**: Previous Q&A

### Example dengan Knowledge Context

**Knowledge Context (in Session):**
```
Course: Introduction to Biology
Topics: Cell structure, DNA, Photosynthesis, Mitosis
Level: High School Grade 10
```

**Question:**
```
Create 5 quiz questions covering all topics in the knowledge base.
```

**Response akan disesuaikan** dengan context yang sudah di-set di session.

## Prefixes untuk Structure

### Input/Output Prefixes

```
System Prompt: You are a quiz generator.

Input Text:
"""
[paste chapter content here]
"""

Task: Create 10 multiple choice questions.
Format: [specify format]
Output:
```

### Example Prefixes in Few-shot

```
Text: "The mitochondria is the powerhouse of the cell"
Category: Biology
Difficulty: Easy

Text: "Explain Heisenberg's uncertainty principle"
Category: Physics  
Difficulty: Hard

Text: "What is a linked list?"
Category: Computer Science
Difficulty:
```

## Breaking Down Complex Prompts

### Chain Prompts (Sequential)

**Step 1: Extract Topics**
```
List all main topics covered in this chapter.
```

**Step 2: Create Outline**
```
For each topic [from Step 1], create a quiz outline with 2 questions.
```

**Step 3: Generate Questions**
```
Using the outline [from Step 2], create full questions with answers.
```

### Aggregate Responses (Parallel)

```
Part 1: Create 5 questions about Biology topics
Part 2: Create 5 questions about Chemistry topics
Part 3: Combine both sets and order by difficulty
```

## Model Parameters di GenovaAI

### Temperature

- **0.0-0.3**: Deterministic, factual responses (recommended for quiz generation)
- **0.4-0.7**: Balanced creativity and accuracy (default: 0.7)
- **0.8-1.0**: Creative, varied responses (for brainstorming)
- **> 1.0**: Very random (not recommended for educational content)

> **Important**: Untuk Gemini 3 models, **keep temperature at 1.0** (default).

### Max Output Tokens

- **256-512**: Short answers, single questions
- **1024-2048**: Medium content (default: 2048)
- **2048-4096**: Long essays, multiple questions
- **4096-8192**: Very detailed explanations

### Configuration Example

```json
{
  "model": "gemini-2.5-flash",
  "temperature": 0.7,
  "maxOutputTokens": 2048,
  "topP": 0.95,
  "topK": 40
}
```

## Prompt Templates for GenovaAI

### Quiz Generation Template

```
System Instruction: You are a quiz generator for educational content.

Context:
Subject: [subject name]
Topic: [specific topic]
Level: [beginner/intermediate/advanced]
Number of questions: [n]

Knowledge Base:
[paste study material or upload file]

Task:
Create [n] multiple choice questions that:
1. Cover key concepts from the material
2. Have 4 options (A, B, C, D)
3. Include one correct answer
4. Are appropriate for the specified level

Format:
Question [number]:
[Question text]

A) [option]
B) [option]
C) [option]
D) [option]

Correct Answer: [letter]
Explanation: [brief explanation]
```

### Study Summary Template

```
System Instruction: You are a study assistant helping students review material.

Task: Summarize the following content in a student-friendly format

Structure:
1. Main Topic (1 sentence)
2. Key Concepts (bullet points)
3. Important Details (2-3 paragraphs)
4. Study Tips (bullet points)

Content:
[paste or upload study material]

Constraints:
- Keep summary under 500 words
- Use simple, clear language
- Highlight important terms
- Include examples where helpful
```

### Code Explanation Template

```
System Instruction: You are a programming tutor.

Code:
```
[paste code here]
```

Task:
Explain this code in the following format:

1. **Purpose**: What does this code do? (1-2 sentences)
2. **Step-by-Step**: Line by line explanation
3. **Key Concepts**: What programming concepts are used?
4. **Potential Issues**: Any bugs or improvements?
5. **Practice**: Suggest a similar problem to try

Level: [beginner/intermediate/advanced]
```

### Essay Assistance Template

```
System Instruction: You are an academic writing assistant.

Essay Topic: [topic]
Required Length: [word count]
Academic Level: [high school/undergraduate/graduate]

Current Draft/Outline:
[paste text]

Task: [choose one]
- Improve thesis statement
- Add supporting arguments
- Improve flow and transitions
- Check grammar and style
- Suggest relevant sources

Output:
Provide specific suggestions with examples.
```

## Gemini 3 Specific Best Practices

### Direct and Precise

✅ **Good:**
```
Create 5 biology quiz questions about photosynthesis.
```

❌ **Avoid:**
```
I would really appreciate it if you could possibly help me by 
creating approximately 5 questions, if that's okay, about the 
topic of photosynthesis in biology...
```

### Structured with Tags

```xml
<role>
You are a quiz generator for high school students.
</role>

<constraints>
1. Questions must be age-appropriate
2. Include both factual and conceptual questions
3. Provide clear, unambiguous answers
</constraints>

<context>
Subject: Biology
Topic: Cell Division
Level: Grade 10
</context>

<task>
Create 5 multiple choice questions with 4 options each.
</task>
```

### Planning Requests

```
Before creating the quiz questions, please:
1. Identify the 3 most important concepts in the material
2. Determine appropriate difficulty distribution (easy/medium/hard)
3. Plan question types (factual, application, analysis)

Then create the questions following your plan.
```

### Long Context Handling

```
[Large document/chapter content here - put context FIRST]

--- End of Context ---

Based on the information above, create a comprehensive quiz 
covering all major topics discussed in the text.
```

## Iteration Strategies

### Version Testing

**Version 1 (Direct):**
```
Explain photosynthesis
```

**Version 2 (With Level):**
```
Explain photosynthesis to a 10th grade student
```

**Version 3 (With Format):**
```
Explain photosynthesis to a 10th grade student using:
1. Simple definition
2. Main steps (numbered list)
3. Real-world example
```

### A/B Testing Prompts

Test berbagai approaches dan track mana yang menghasilkan best results:

1. **Track metrics**: Response quality, relevance, format compliance
2. **Compare variations**: Different phrasings, structures, examples
3. **Iterate**: Refine based on results

## Common Pitfalls to Avoid

❌ **Too Vague:**
```
Tell me about biology
```

✅ **Specific:**
```
Explain the process of mitosis in 5 steps for high school students
```

---

❌ **Ambiguous Instructions:**
```
Make some questions about this
```

✅ **Clear Requirements:**
```
Create 10 multiple choice questions with 4 options each, 
covering all topics in the provided text
```

---

❌ **Inconsistent Few-shot:**
```
Example 1: Q: Question? A: Answer
Example 2: 
Question text
Answer text
```

✅ **Consistent Format:**
```
Example 1:
Q: Question text here
A: Answer text here

Example 2:
Q: Question text here
A: Answer text here
```

## Context Caching (Advanced)

For repeated use of large contexts (entire textbooks, course materials):

### When to Use Caching

- Extensive system instructions (quiz templates)
- Large document sets (textbooks)
- Repetitive analysis of same material
- Code repository analysis

### Minimum Token Limits

| Model | Min Tokens for Caching |
|-------|----------------------|
| gemini-3-pro-preview | 2,048 |
| gemini-2.5-pro | 4,096 |
| gemini-2.5-flash | 1,024 |

### Cost Benefits

- **Cached tokens**: Reduced billing rate
- **Storage**: Pay for TTL duration
- **Repeated use**: Significant savings on large contexts

## GenovaAI-Specific Tips

### Session Configuration Best Practices

1. **Set appropriate System Prompt** based on primary use case
2. **Upload large reference materials** as Knowledge Files
3. **Use Knowledge Context** for session-specific info
4. **Select appropriate Answer Mode**:
   - `single`: Brief, one-line answers
   - `short`: Concise paragraph (recommended for quiz)
   - `medium`: Detailed explanation
   - `long`: Comprehensive response

### Request Modes

- **Free (User Key)**: Your own Gemini API key
- **Free (Pool)**: Shared key pool (may have rate limits)
- **Premium**: Credits-based, priority processing

### File Upload Optimization

- **PDFs**: Set to `media_resolution_medium` for best OCR
- **Text files**: Extract and use as Knowledge Context
- **Large files**: Consider chunking or summarization first

## Examples in Practice

### Example 1: Generate Quiz from PDF

**Session Setup:**
- System Prompt: Quiz Generator template
- Knowledge Files: biology_chapter5.pdf
- Model: gemini-2.5-flash
- Answer Mode: medium

**Prompt:**
```
Create 10 multiple choice questions from Chapter 5.
Mix of difficulty levels (3 easy, 5 medium, 2 hard).
Include correct answers and brief explanations.
```

### Example 2: Study Helper with Chat History

**Turn 1:**
```
Explain DNA replication in simple terms
```

**Turn 2 (with context from Turn 1):**
```
Create a quiz question testing understanding of what you just explained
```

### Example 3: Code Tutoring

**Session Setup:**
- System Prompt: Code Tutor template
- Knowledge Files: student_code.py
- Model: gemini-2.5-pro

**Prompt:**
```
Review this code and:
1. Explain what it does
2. Identify any bugs
3. Suggest improvements
4. Provide corrected version with comments
```

## Further Resources

- [Gemini Prompt Gallery](https://ai.google.dev/examples)
- [GenovaAI Model Configuration](./GEMINI_API_CONFIG.md)
- [Session Management Guide](./SESSION_MANAGEMENT.md)
- [Best Practices for Educational Content](./EDUCATIONAL_BEST_PRACTICES.md)

## Quick Reference

### Prompt Checklist

- [ ] Clear, specific instructions
- [ ] Appropriate system instruction
- [ ] Context provided (if needed)
- [ ] Output format specified
- [ ] Few-shot examples (recommended)
- [ ] Constraints defined
- [ ] Token limits considered
- [ ] Temperature appropriate for task

### Common Patterns

**Generate Content:**
```
Create [n] [type] about [topic]
Format: [structure]
Level: [difficulty]
```

**Analyze Content:**
```
Analyze [content] for [aspect]
Focus on: [specific elements]
Output: [format]
```

**Transform Content:**
```
Convert [source] to [target format]
Preserve: [key elements]
Constraints: [limitations]
```

**Compare/Contrast:**
```
Compare [item1] and [item2]
Aspects: [list aspects]
Format: [table/paragraph/bullets]
```
