# File Upload & Multimodal Guide - GenovaAI

## Overview

GenovaAI mendukung multimodal input melalui Gemini API, memungkinkan Anda untuk bekerja dengan berbagai tipe file termasuk PDF, images, audio, dan video. Guide ini menjelaskan cara upload dan menggunakan file dalam prompts.

## Supported File Types

### Documents
- **PDF**: Native document understanding (up to 1000 pages, 50MB)
- **TXT**: Plain text files
- **DOCX**: Microsoft Word documents (extracted as text)

### Images
- **JPEG/JPG**: Standard image format
- **PNG**: Lossless image format
- **WEBP**: Modern image format
- **GIF**: Animated or static images

### Audio
- **MP3**: Compressed audio
- **WAV**: Uncompressed audio
- **M4A**: Apple audio format

### Video
- **MP4**: Standard video format
- **MOV**: QuickTime format
- **WEBM**: Web video format

## File Upload in GenovaAI

### Through Extension Session

GenovaAI menyimpan file uploads di database dan file system server.

**API Endpoint:**
```
POST /api/customer/genovaai/knowledge/upload
```

**Request (multipart/form-data):**
```
{
  "file": [File object],
  "sessionId": "session_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file_xxx",
    "fileName": "chapter5.pdf",
    "fileType": "PDF",
    "fileSize": 2048576,
    "extractedText": "...",
    "uploadedAt": "2025-11-23T10:00:00Z"
  }
}
```

### File Storage Architecture

```
Storage Location: /uploads/{userId}/{sessionId}/
Database: KnowledgeFile table
Retention: Permanent (until manually deleted)
Max Size: 50MB per file
Max Files: Unlimited per user
```

### Get Session Files

```
GET /api/customer/genovaai/knowledge?sessionId={sessionId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "file_xxx",
      "fileName": "biology_chapter.pdf",
      "fileType": "PDF",
      "fileSize": 1048576,
      "uploadedAt": "2025-11-23T10:00:00Z",
      "isActive": true
    }
  ]
}
```

### Delete File

```
DELETE /api/customer/genovaai/knowledge/{fileId}
```

## PDF Document Understanding

### Native PDF Processing

Gemini dapat memahami PDF secara native dengan vision capabilities:

- **Text extraction**: Automatic OCR untuk semua text
- **Image understanding**: Diagrams, charts, tables
- **Layout preservation**: Formatting dan structure
- **Multi-page**: Up to 1000 pages per document

### PDF Limits

| Limit Type | Value |
|-----------|-------|
| Max File Size | 50 MB |
| Max Pages | 1000 pages |
| Page Resolution | 3072x3072 (scaled down) or 768x768 (scaled up) |
| Processing Time | ~5-30 seconds depending on size |
| Cost | Free (included in API usage) |

### PDF Upload Example

**In GenovaAI Extension:**

1. User uploads PDF through extension
2. File sent to server via API
3. Server stores file and extracts text
4. Text stored in `KnowledgeFile.extractedText`
5. File linked to session via `knowledgeFileIds`

**In Server Processing:**

```typescript
// FileUploadService.ts extracts text
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

// For PDF
const pdfBuffer = fs.readFileSync(filePath);
const pdfData = await pdfParse(pdfBuffer);
const extractedText = pdfData.text;

// Store in database
await prisma.knowledgeFile.create({
  data: {
    userId,
    sessionId,
    fileName,
    fileType: 'PDF',
    filePath,
    extractedText,
    fileSize
  }
});
```

## Using Files in Prompts

### Automatic Context Injection

When you ask a question in GenovaAI:

1. System retrieves session configuration
2. Gets `knowledgeContext` (manual text)
3. Gets all files from `knowledgeFileIds`
4. Combines into single context
5. Sends to Gemini with your question

**Server Implementation:**
```typescript
// LLMGatewayService.ts
let combinedKnowledge = session.knowledgeContext || '';

if (session.knowledgeFileIds && session.knowledgeFileIds.length > 0) {
  const files = await FileUploadService.getSessionFiles(
    session.sessionId, 
    request.userId
  );
  
  const fileContents = files
    .map((file, index) => {
      const content = file.extractedText || '';
      return `\n\n--- File ${index + 1}: ${file.fileName} ---\n${content}`;
    })
    .join('\n');
  
  combinedKnowledge += '\n\n--- Uploaded Files ---' + fileContents;
}
```

### Prompt with PDF Context

**User's Question:**
```
Create 10 quiz questions about Chapter 5
```

**What Gemini Receives:**
```
System Instruction: You are a quiz assistant...

Knowledge Base:
--- Uploaded Files ---
--- File 1: biology_chapter5.pdf (PDF) ---
[Full extracted text from PDF]

Question: Create 10 quiz questions about Chapter 5
```

## Multimodal Prompting Best Practices

### 1. Be Specific with File References

❌ **Vague:**
```
What's in the document?
```

✅ **Specific:**
```
From the PDF uploaded, extract all key definitions 
and create a glossary in alphabetical order.
```

### 2. Put Large Context First

✅ **Optimal Order:**
```
[PDF Document Content]
[Images]
[Knowledge Context]

Based on the information above, answer: [Your Question]
```

### 3. Multi-File Prompts

When multiple files are uploaded:

```
Analyze all uploaded documents and:
1. List main topics from each document
2. Find common themes across documents
3. Create a summary table comparing key points
```

### 4. Image + Text Combinations

```
System Instruction: You are a science tutor.

Knowledge Files:
- textbook_chapter.pdf (text content)
- diagram_cell.png (visual aid)

Question:
Explain cellular respiration using both the textbook 
definition and the diagram provided.
```

## File Processing Strategies

### For Large PDFs (> 100 pages)

**Strategy 1: Chunk Processing**
```
1. Upload full PDF to session
2. Ask specific questions about sections
   "Summarize pages 50-75"
3. Aggregate answers
```

**Strategy 2: Extract Key Pages**
```
1. Ask: "Which sections cover [topic]?"
2. Ask: "Explain [topic] from the relevant section"
```

### For Multiple Documents

**Comparison Task:**
```
Compare the methodologies in:
- research_paper1.pdf
- research_paper2.pdf

Output as a comparison table.
```

**Synthesis Task:**
```
Based on all 3 uploaded articles, synthesize 
the main arguments into a unified summary.
```

## Image Understanding

### Image Prompting Tips

**For Diagrams:**
```
Analyze this biological diagram and:
1. Label all parts
2. Explain the process shown
3. Describe how components interact
```

**For Screenshots:**
```
From this code screenshot:
1. Identify the programming language
2. Explain what the code does
3. Point out any potential bugs
```

**For Photos:**
```
Based on this photo of a historical artifact:
1. Describe what you see
2. Estimate time period
3. Explain historical significance
```

### Image + Context

```
Knowledge Context:
Period: Ancient Rome
Topic: Architecture

[Upload image of ruins]

Question:
Identify this Roman structure and explain its 
architectural significance based on the course material.
```

## Token Consumption

### PDF Document Tokens

- **1 PDF page** = ~258 tokens
- **100-page PDF** = ~25,800 tokens
- **Text-only mode**: Extracted text counted normally

### Image Tokens (Gemini 3)

| Resolution | Tokens per Image |
|-----------|-----------------|
| Low | 280 |
| Medium | 560 |
| High | 1120 |

**For GenovaAI:**
- Default: Medium resolution
- Optimal for most educational content

### Context Window Management

**Gemini 2.5 Flash:**
- Input: 1M tokens
- Output: 64K tokens

**Example Calculation:**
```
System Prompt: 100 tokens
Knowledge Context: 500 tokens
PDF (50 pages): 12,900 tokens
Your Question: 50 tokens
--------------------------------
Total Input: ~13,550 tokens
Remaining: ~987,000 tokens ✓
```

## Technical Implementation

### File Upload Service

```typescript
// src/services/file-upload-service.ts
export class FileUploadService {
  
  static async uploadFile(
    userId: string,
    sessionId: string,
    file: File
  ) {
    // 1. Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) throw new Error(validation.error);
    
    // 2. Create upload directory
    const uploadDir = `/uploads/${userId}/${sessionId}`;
    await fs.promises.mkdir(uploadDir, { recursive: true });
    
    // 3. Save file
    const filePath = `${uploadDir}/${file.name}`;
    await fs.promises.writeFile(filePath, file.buffer);
    
    // 4. Extract text
    const extractedText = await this.extractText(filePath, file.type);
    
    // 5. Save to database
    const knowledgeFile = await prisma.knowledgeFile.create({
      data: {
        userId,
        sessionId,
        fileName: file.name,
        fileType: this.getFileType(file.type),
        fileSize: file.size,
        filePath,
        extractedText
      }
    });
    
    return knowledgeFile;
  }
  
  static async extractText(filePath: string, mimeType: string) {
    if (mimeType === 'application/pdf') {
      const buffer = await fs.promises.readFile(filePath);
      const pdf = await pdfParse(buffer);
      return pdf.text;
    }
    
    if (mimeType.includes('word')) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    
    if (mimeType === 'text/plain') {
      return await fs.promises.readFile(filePath, 'utf-8');
    }
    
    return null; // For images, audio, video (no text extraction)
  }
}
```

### Gemini API Integration

```typescript
// src/services/llm-gateway-service.ts
private static async callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  knowledge: string | null,
  question: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: Array<{ text: string }> = [];
  
  // Add knowledge context first (includes file contents)
  if (knowledge) {
    parts.push({ text: `Knowledge Base:\n${knowledge}\n\n` });
  }
  
  // Add question last
  parts.push({ text: `Question: ${question}` });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { 
        parts: [{ text: systemPrompt }] 
      },
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

## Troubleshooting

### File Upload Issues

**Error: File too large**
```json
{
  "success": false,
  "error": "File size exceeds 50MB limit"
}
```
**Solution**: Compress or split the PDF

**Error: Unsupported file type**
```json
{
  "success": false,
  "error": "File type .xyz not supported"
}
```
**Solution**: Convert to supported format (PDF, DOCX, TXT)

**Error: Text extraction failed**
- Check if PDF is scanned (image-based)
- Try OCR preprocessing
- Upload as image instead

### Context Window Issues

**Error: Token limit exceeded**
```json
{
  "success": false,
  "error": "Input exceeds context window"
}
```

**Solution:**
1. Reduce number of files
2. Use shorter questions
3. Remove unnecessary knowledge context
4. Ask about specific sections

### Model Not Understanding Files

**Issue**: Generic responses not using file content

**Solutions:**
1. Add explicit reference in prompt:
   ```
   Based on the uploaded PDF document about [topic]...
   ```

2. Ask model to describe first:
   ```
   First, summarize what's in the uploaded files.
   Then, answer: [your question]
   ```

3. Be specific about which file:
   ```
   From biology_chapter5.pdf, extract all definitions.
   ```

## Best Practices Summary

### Upload Strategy
- ✅ Upload files at session start
- ✅ Keep files relevant to session topic
- ✅ Remove unused files to save space
- ✅ Use descriptive file names

### Prompting Strategy
- ✅ Put context before questions
- ✅ Reference files explicitly
- ✅ Use few-shot examples
- ✅ Structure output format

### Performance Optimization
- ✅ Reuse session files for multiple questions
- ✅ Batch related questions
- ✅ Cache large documents
- ✅ Monitor token usage

### Quality Assurance
- ✅ Verify text extraction quality
- ✅ Test with sample questions
- ✅ Check output format
- ✅ Validate against source

## API Reference

### Upload File
```typescript
POST /api/customer/genovaai/knowledge/upload
Content-Type: multipart/form-data

Body:
{
  file: File,
  sessionId: string
}

Response:
{
  success: boolean,
  data: KnowledgeFile
}
```

### List Files
```typescript
GET /api/customer/genovaai/knowledge?sessionId={id}

Response:
{
  success: boolean,
  data: KnowledgeFile[]
}
```

### Download File
```typescript
GET /api/customer/genovaai/knowledge/{id}/download

Response: File stream
```

### Delete File
```typescript
DELETE /api/customer/genovaai/knowledge/{id}

Response:
{
  success: boolean,
  message: string
}
```

## Examples

### Example 1: Quiz from PDF

```typescript
// 1. Upload PDF
const file = await uploadFile(textbookPDF);

// 2. Set in session
await updateSession({
  knowledgeFileIds: [file.id]
});

// 3. Ask questions
const response = await ask({
  question: "Create 10 multiple choice questions from Chapter 3"
});
```

### Example 2: Multi-Document Analysis

```typescript
// Upload multiple files
const files = await Promise.all([
  uploadFile(paper1),
  uploadFile(paper2),
  uploadFile(paper3)
]);

// Set all in session
await updateSession({
  knowledgeFileIds: files.map(f => f.id)
});

// Compare
const comparison = await ask({
  question: "Compare methodologies across all three papers"
});
```

### Example 3: Image + Text

```typescript
// Upload both
const textFile = await uploadFile(chapterPDF);
const imageFile = await uploadFile(diagramPNG);

// Set in session
await updateSession({
  knowledgeFileIds: [textFile.id, imageFile.id]
});

// Ask with both contexts
const explanation = await ask({
  question: "Explain the process using both the textbook and diagram"
});
```

## Related Documentation

- [Prompt Design Strategies](./PROMPT_DESIGN_STRATEGIES.md)
- [Gemini API Configuration](./GEMINI_API_CONFIG.md)
- [Session Management](./SESSION_MANAGEMENT.md)
