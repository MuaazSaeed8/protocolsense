import { supabase } from '../lib/supabase';
import { ExamplePair, AnalysisResult, ExtractedExample, ComparisonResult, ValidationAttempt } from '../types';

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

async function withRetry<T>(operation: () => Promise<T>, retries = RETRY_ATTEMPTS, delayMs = RETRY_DELAY_MS): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        console.warn(`API call failed (attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

async function callGroq(params: {
  messages: Message[];
  response_format?: { type: string };
  temperature?: number;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke('groq-proxy', {
    body: params,
  });
  if (error) throw new Error(error.message);
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from AI');
  return content;
}

export async function analyzeProtocol(examples: ExamplePair[]): Promise<AnalysisResult> {
  const exampleString = examples
    .map((e, i) => `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${e.output}`)
    .join('\n\n');

  const prompt = `Analyze the following input/output pairs from an unknown system.
  Your goal is to infer the implicit rules, logic, and constraints of the system.

  For each rule identified:
  - Restate the rule clearly and precisely.
  - Reference supporting example indices (e.g., "Example 1", "Example 2").
  - Do not inflate confidence or speculate.

  EXAMPLES:
  ${exampleString}

  Return a JSON object with this exact structure:
  {
    "system_summary": "string describing what the system does",
    "rules": [
      {
        "id": "rule_1",
        "description": "clear rule description",
        "confidence": 85,
        "evidence": "direct evidence from data",
        "supporting_examples": ["Example 1", "Example 2"]
      }
    ],
    "edge_cases": ["edge case description"],
    "ambiguities": ["ambiguity description"]
  }`;

  try {
    const text = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }));
    return JSON.parse(text);
  } catch (error) {
    console.error('Error analyzing protocol:', error);
    throw error;
  }
}

export async function compareProtocols(resultA: AnalysisResult, resultB: AnalysisResult): Promise<ComparisonResult> {
  const prompt = `You are comparing two versions of the same inferred protocol.

VERSION A SUMMARY: ${resultA.system_summary}
VERSION A RULES:
${resultA.rules.map(r => `- [${r.id}] ${r.description}`).join('\n')}

VERSION B SUMMARY: ${resultB.system_summary}
VERSION B RULES:
${resultB.rules.map(r => `- [${r.id}] ${r.description}`).join('\n')}

Your task:
1. Identify semantic behavior changes, not cosmetic differences.
2. List which rules were added, removed, or modified.
3. For modified rules, explain why the change occurred based on new evidence in Version B.
4. Assess backward compatibility impact: LOW | MEDIUM | HIGH.
5. Provide a concrete break example: One realistic example of how an existing integration relying on Version A could fail when encountering Version B behavior.

Return a JSON object with this exact structure:
{
  "summary": "string",
  "added_rules": ["rule description"],
  "removed_rules": ["rule description"],
  "modified_rules": [{ "id": "rule_1", "change_reason": "why it changed" }],
  "backward_compatibility_impact": "LOW | MEDIUM | HIGH",
  "concrete_break_example": "string",
  "diffs": [
    {
      "id": "rule_1",
      "type": "NEW | CHANGED | REMOVED | UNCHANGED",
      "description": "string",
      "oldDescription": "string",
      "confidence": 90,
      "oldConfidence": 80,
      "breakingImpact": "string"
    }
  ]
}`;

  try {
    const text = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }));
    return JSON.parse(text);
  } catch (error) {
    console.error('Error comparing protocols:', error);
    throw error;
  }
}

export async function validateProtocolInput(
  input: string,
  result: AnalysisResult,
): Promise<Partial<ValidationAttempt>> {
  const rulesString = result.rules.map(r => `- [${r.id}] ${r.description} (Confidence: ${r.confidence}%)`).join('\n');

  const prompt = `You are validating a new input against an already learned protocol specification.

Context provided:
- System Summary: ${result.system_summary}
- Inferred Protocol Rules:
${rulesString}

New Proposed Input Payload:
${input}

Your task:
1. Determine whether the input is VALID, INVALID, or UNDEFINED under the learned protocol.
2. If INVALID, list the exact rule IDs that are violated in the 'violated_rules' field.
3. If UNDEFINED, explain which behavior is not yet supported by evidence.
4. Do not guess outputs or behavior not covered by rules.
5. Do not soften failures.
6. Provide a clear technical explanation and an optional suggested fix.

Return a JSON object with this exact structure:
{
  "status": "VALID | INVALID | UNDEFINED",
  "violated_rules": ["rule_id"],
  "explanation": "clear technical explanation",
  "suggested_fix": "optional correction"
}`;

  try {
    const text = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }));
    return JSON.parse(text);
  } catch (error) {
    console.error('Error validating input:', error);
    throw error;
  }
}

export async function extractDataFromText(text: string): Promise<ExtractedExample> {
  const prompt = `Extract the input and output from this natural language description. Return valid JSON objects.
  For example, 'order 3 books as a member' should become input: { "item": "book", "quantity": 3, "member": true }.
  'total is 48' should become output: { "total": 48 }.
  Always return structured JSON, not plain text strings.

  Description: "${text}"

  Return a JSON object with this exact structure:
  {
    "input": "JSON string of the input payload",
    "output": "JSON string of the output payload"
  }`;

  try {
    const responseText = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }));

    const raw = JSON.parse(responseText);

    const formatJson = (val: string) => {
      try {
        return JSON.stringify(JSON.parse(val), null, 2);
      } catch {
        return val;
      }
    };

    return { input: formatJson(raw.input), output: formatJson(raw.output) };
  } catch (error) {
    throw error;
  }
}

export async function extractDataFromCurl(curl: string, responseText: string): Promise<ExtractedExample> {
  const prompt = `Extract input/output from cURL: ${curl} and Response: ${responseText}

  Return a JSON object with this exact structure:
  {
    "input": "JSON string of the request payload",
    "output": "JSON string of the response payload"
  }`;

  try {
    const text = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }));
    return JSON.parse(text);
  } catch (error) {
    throw error;
  }
}

export async function diagnoseFailure(
  request: string,
  errorResponse: string,
  result: AnalysisResult,
): Promise<string> {
  const rulesString = result.rules.map(r => `- [${r.id}] ${r.description}`).join('\n');
  const prompt = `You are a ProtocolSense system debugger.

System Rules:
${rulesString}

Failed Request:
${request}

Error Response:
${errorResponse}

Task: Explain what went wrong based on the rules, identify the specific rule violated, and provide the corrected JSON input.

Format your response exactly like this:

### What went wrong
[Explanation]

### Rule violated
[Rule ID]: [Rule Description]

### Suggested fix
\`\`\`json
[Corrected JSON]
\`\`\`
`;

  try {
    const text = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }));
    return text || 'Could not diagnose the failure.';
  } catch (error) {
    throw error;
  }
}

export async function generateImplementationCode(
  result: AnalysisResult,
  language: 'typescript' | 'python' | 'zod' | 'openapi',
): Promise<string> {
  const instructions: Record<string, string> = {
    typescript: 'Generate a TypeScript interface and a validation function that checks input against these rules. Use distinct types where appropriate.',
    python: 'Generate a Pydantic model and a validator function. Ensure field constraints match the rules.',
    zod: 'Generate a Zod schema that enforces these rules strictly.',
    openapi: 'Generate a valid OpenAPI 3.0 YAML specification for an endpoint that accepts this input and returns the inferred output format.',
  };

  const prompt = `Generate implementation in ${language} for the following inferred system protocol.

  System Summary: ${result.system_summary}

  Rules:
  ${result.rules.map(r => `- ${r.description} (Confidence: ${r.confidence}%)`).join('\n')}

  Task: ${instructions[language]}

  IMPORTANT: Return ONLY the raw code/yaml. Do not wrap in markdown code blocks. Do not include conversational text.`;

  try {
    let code = await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }));
    if (code.startsWith('```')) {
      code = code.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');
    }
    return code;
  } catch (error) {
    throw error;
  }
}

export async function generateDocumentation(
  result: AnalysisResult,
  examples: ExamplePair[],
): Promise<string> {
  const prompt = `Generate Markdown docs for: ${result.system_summary}`;

  try {
    return await withRetry(() => callGroq({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }));
  } catch (error) {
    throw error;
  }
}

export async function askAiAboutProtocol(
  question: string,
  result: AnalysisResult,
  chatHistory: { role: string; content: string }[],
): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: `You are a ProtocolSense Expert. System: ${result.system_summary}` },
    ...chatHistory.map(h => ({
      role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: h.content,
    })),
    { role: 'user', content: question },
  ];

  try {
    const text = await withRetry(() => callGroq({ messages, temperature: 0.7 }));
    return text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    throw error;
  }
}
