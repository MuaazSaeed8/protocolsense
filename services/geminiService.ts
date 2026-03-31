import { GoogleGenAI, Type } from "@google/genai";
import { ExamplePair, AnalysisResult, Rule, TestCase, TestSuite, DiagnosisResult, ExtractedExample, ComparisonResult, ValidationAttempt } from "../types";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to your Vercel environment variables.');
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

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

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    system_summary: {
      type: Type.STRING,
      description: "A brief description of what this system appears to do based on the examples provided.",
    },
    rules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the rule (e.g. rule_1)." },
          description: { type: Type.STRING, description: "A clear and precise restatement of the inferred rule." },
          confidence: { type: Type.NUMBER, description: "Confidence level between 0 and 100." },
          evidence: { type: Type.STRING, description: "Direct evidence observed in the data." },
          supporting_examples: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Indices or identifiers of examples that support this rule."
          },
        },
        required: ["id", "description", "confidence", "evidence", "supporting_examples"],
      },
    },
    edge_cases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Potential edge cases to test for further validation.",
    },
    ambiguities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Elements that remain unclear or require more examples to confirm.",
    },
  },
  required: ["system_summary", "rules", "edge_cases", "ambiguities"],
};

const COMPARISON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    added_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
    removed_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
    modified_rules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          change_reason: { type: Type.STRING }
        },
        required: ["id", "change_reason"]
      }
    },
    backward_compatibility_impact: { type: Type.STRING, description: "LOW | MEDIUM | HIGH" },
    concrete_break_example: { type: Type.STRING },
    diffs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "NEW, CHANGED, REMOVED, or UNCHANGED" },
          description: { type: Type.STRING },
          oldDescription: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          oldConfidence: { type: Type.NUMBER },
          breakingImpact: { type: Type.STRING }
        },
        required: ["id", "type", "description", "confidence"]
      }
    }
  },
  required: ["summary", "added_rules", "removed_rules", "modified_rules", "backward_compatibility_impact", "concrete_break_example", "diffs"]
};

const VALIDATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      description: "One of: VALID, INVALID, UNDEFINED",
    },
    violated_rules: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of IDs of rules that were violated. Empty if VALID or UNDEFINED.",
    },
    explanation: {
      type: Type.STRING,
      description: "Clear technical explanation in plain language.",
    },
    suggested_fix: {
      type: Type.STRING,
      description: "Optional correction if rules clearly imply one.",
    }
  },
  required: ["status", "violated_rules", "explanation"]
};

const SINGLE_EXTRACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    input: { type: Type.STRING, description: "Extracted input payload as a valid JSON string" },
    output: { type: Type.STRING, description: "Extracted output response as a valid JSON string" }
  },
  required: ["input", "output"]
};

export async function analyzeProtocol(examples: ExamplePair[]): Promise<AnalysisResult> {
  const exampleString = examples
    .map((e, i) => `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${e.output}`)
    .join("\n\n");

  const prompt = `Analyze the following input/output pairs from an unknown system. 
  Your goal is to infer the implicit rules, logic, and constraints of the system.
  
  For each rule identified:
  - Restate the rule clearly and precisely.
  - Reference supporting example indices (e.g., "Example 1", "Example 2").
  - Do not inflate confidence or speculate.
  
  EXAMPLES:
  ${exampleString}
  
  Strictly follow the JSON output format provided in the schema.`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
          temperature: 0.1,
        },
      });
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error analyzing protocol:", error);
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

Return the analysis in JSON format following the provided schema.`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: COMPARISON_SCHEMA,
          temperature: 0.1,
        },
      });
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error comparing protocols:", error);
    throw error;
  }
}

export async function validateProtocolInput(
  input: string, 
  result: AnalysisResult
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

Return the result in JSON matching the specified schema.`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: VALIDATION_SCHEMA,
          temperature: 0.1,
        },
      });
    });

    if (!response.text) {
      throw new Error("No validation response from AI");
    }

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error validating input:", error);
    throw error;
  }
}

export async function extractDataFromText(text: string): Promise<ExtractedExample> {
  const prompt = `Extract the input and output from this natural language description. Return valid JSON objects.
  For example, 'order 3 books as a member' should become input: { "item": "book", "quantity": 3, "member": true }. 
  'total is 48' should become output: { "total": 48 }. 
  Always return structured JSON, not plain text strings.
  
  Description: "${text}"`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SINGLE_EXTRACTION_SCHEMA,
          temperature: 0.1,
        }
      });
    });

    if (!response.text) {
      throw new Error("Failed to extract data");
    }

    const raw = JSON.parse(response.text.trim());

    const formatJson = (val: string) => {
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If it's not valid JSON, return as is (fallback to plain text)
        return val;
      }
    };

    return {
      input: formatJson(raw.input),
      output: formatJson(raw.output)
    };
  } catch (error) {
    throw error;
  }
}

export async function extractDataFromCurl(curl: string, responseText: string): Promise<ExtractedExample> {
  const prompt = `Extract input/output from cURL: ${curl} and Response: ${responseText}`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SINGLE_EXTRACTION_SCHEMA,
          temperature: 0.1,
        }
      });
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    throw error;
  }
}

export async function diagnoseFailure(
  request: string,
  errorResponse: string,
  result: AnalysisResult
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
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.2 }
      });
    });
    return response.text || "Could not diagnose the failure.";
  } catch (error) {
    throw error;
  }
}

export async function generateImplementationCode(
  result: AnalysisResult,
  language: 'typescript' | 'python' | 'zod' | 'openapi'
): Promise<string> {
  let specificInstruction = "";
  if (language === 'typescript') {
    specificInstruction = "Generate a TypeScript interface and a validation function that checks input against these rules. Use distinct types where appropriate.";
  } else if (language === 'python') {
    specificInstruction = "Generate a Pydantic model and a validator function. Ensure field constraints match the rules.";
  } else if (language === 'zod') {
    specificInstruction = "Generate a Zod schema that enforces these rules strictly.";
  } else if (language === 'openapi') {
    specificInstruction = "Generate a valid OpenAPI 3.0 YAML specification for an endpoint that accepts this input and returns the inferred output format.";
  }

  const prompt = `Generate implementation in ${language} for the following inferred system protocol.
  
  System Summary: ${result.system_summary}
  
  Rules:
  ${result.rules.map(r => `- ${r.description} (Confidence: ${r.confidence}%)`).join('\n')}
  
  Task: ${specificInstruction}
  
  IMPORTANT: Return ONLY the raw code/yaml. Do not wrap in markdown code blocks. Do not include conversational text.`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { temperature: 0.2 },
      });
    });
    
    // Cleanup any accidental markdown wrapping
    let code = response.text || "";
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
  examples: ExamplePair[]
): Promise<string> {
  const prompt = `Generate Markdown docs for: ${result.system_summary}`;

  try {
    const response = await withRetry(async () => {
      return await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { temperature: 0.2 },
      });
    });
    return response.text || "";
  } catch (error) {
    throw error;
  }
}

export async function askAiAboutProtocol(
  question: string,
  result: AnalysisResult,
  chatHistory: { role: string; content: string }[]
): Promise<string> {
  const systemInstruction = `You are a ProtocolSense Expert. System: ${result.system_summary}`;

  try {
    const chat = getAI().chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction, temperature: 0.7 },
      history: chatHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }))
    });

    const response = await withRetry(async () => {
      return await chat.sendMessage({ message: question });
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    throw error;
  }
}