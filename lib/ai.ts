import Groq from "groq-sdk";

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

interface LLMResponse {
  content: string | null;
  tool_calls: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(
  messages: ChatMessage[],
  tools: ToolDef[],
  retryCount: number = 0
): Promise<LLMResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY!);

  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const geminiTools =
    tools.length > 0
      ? [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.function.name,
              description: t.function.description,
              parameters: t.function.parameters,
            })),
          },
        ]
      : undefined;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemMsg?.content || undefined,
    tools: geminiTools,
  });

  const geminiHistory: any[] = [];
  const pendingParts: any[] = [];

  for (const msg of chatMessages) {
    if (msg.role === "user") {
      if (pendingParts.length > 0) {
        geminiHistory.push({ role: "model", parts: [...pendingParts] });
        pendingParts.length = 0;
      }
      geminiHistory.push({ role: "user", parts: [{ text: msg.content }] });
    } else if (msg.role === "assistant") {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        for (const tc of msg.tool_calls) {
          let args = {};
          try { args = JSON.parse(tc.function.arguments); } catch {}
          parts.push({ functionCall: { name: tc.function.name, args } });
        }
        geminiHistory.push({ role: "model", parts });
      } else {
        geminiHistory.push({ role: "model", parts: [{ text: msg.content || "" }] });
      }
    } else if (msg.role === "tool") {
      // THIS IS THE FIX - Gemini expects "output" not "response"
      let output: any = {};
      try { output = JSON.parse(msg.content); } catch { output = { result: msg.content }; }
      const toolCall = messages.find(
        (m) => m.role === "assistant" && m.tool_calls?.some((tc: any) => tc.id === msg.tool_call_id)
      );
      const funcName = toolCall?.tool_calls?.find((tc: any) => tc.id === msg.tool_call_id)?.function?.name || "unknown";
      pendingParts.push({
        functionResponse: { name: funcName, response: { name: funcName, content: output } },
      });
    }
  }

  if (pendingParts.length > 0) {
    geminiHistory.push({ role: "user", parts: [...pendingParts] });
  }

  const lastEntry = geminiHistory[geminiHistory.length - 1];
  if (!lastEntry || lastEntry.role !== "user") {
    geminiHistory.push({ role: "user", parts: [{ text: "Continue." }] });
  }

    // Smart context: keep recent messages, summarize older ones
  let trimmedHistory = geminiHistory;
  if (geminiHistory.length > 30) {
    const oldMessages = geminiHistory.slice(0, geminiHistory.length - 20);
    const recentMessages = geminiHistory.slice(geminiHistory.length - 20);
    
    // Build a summary of older context
    const oldTexts: string[] = [];
    for (const msg of oldMessages) {
      if (msg.parts) {
        for (const part of msg.parts) {
          if (part.text) oldTexts.push(`[${msg.role}]: ${part.text.substring(0, 200)}`);
          if (part.functionCall) oldTexts.push(`[tool call]: ${part.functionCall.name}`);
          if (part.functionResponse) oldTexts.push(`[tool result]: ${part.functionResponse.name}`);
        }
      }
    }
    
    const contextSummary = {
      role: "user" as const,
      parts: [{
        text: `[CONVERSATION CONTEXT - Summary of ${oldMessages.length} earlier messages]\n${oldTexts.slice(-30).join("\n")}\n[END CONTEXT - Recent conversation follows]`
      }]
    };
    
    trimmedHistory = [contextSummary, ...recentMessages];
  }

  try {
    const chat = model.startChat({ history: trimmedHistory.slice(0, -1) });
    const lastParts = trimmedHistory[trimmedHistory.length - 1]?.parts || [{ text: "Continue." }];
    const result = await chat.sendMessage(lastParts);
    const resp = result.response;
    const candidates = resp.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
    const funcCalls = parts.filter((p: any) => p.functionCall);

    return {
      content: textParts.join("\n") || null,
      tool_calls: funcCalls.map((fc: any, i: number) => ({
        id: `call_${Date.now()}_${i}`,
        type: "function" as const,
        function: {
          name: fc.functionCall.name,
          arguments: JSON.stringify(fc.functionCall.args || {}),
        },
      })),
    };
  } catch (error: any) {
    if (error.message?.includes("429") && retryCount < 3) {
      const waitTime = Math.pow(2, retryCount) * 2000;
      console.log(`Gemini rate limited, retrying in ${waitTime}ms...`);
      await sleep(waitTime);
      return callGemini(messages, tools, retryCount + 1);
    }
    throw error;
  }
}

// Models ordered by tool calling quality - verified available from your check
const OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "minimax/minimax-m2.5:free",
  "z-ai/glm-4.5-air:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3.6-plus-preview:free",
  "google/gemma-3-27b-it:free",
  "arcee-ai/trinity-large-preview:free",
  "openai/gpt-oss-20b:free",
];

async function callOpenRouter(
  messages: ChatMessage[],
  tools: ToolDef[]
): Promise<LLMResponse> {
  let lastError = "";

  for (const model of OPENROUTER_MODELS) {
    try {
      const body: any = {
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      };
      if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = "auto";
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        lastError = `${model}: ${res.status}`;
        console.error(`OpenRouter ${model} failed:`, lastError);
        continue;
      }

      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) {
        lastError = `${model}: no message`;
        continue;
      }

      console.log(`OpenRouter: using ${model}`);
      return {
        content: msg.content || null,
        tool_calls: (msg.tool_calls || []).map((tc: any) => ({
          id: tc.id || `call_${Date.now()}`,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      };
    } catch (error: any) {
      lastError = `${model}: ${error.message}`;
      continue;
    }
  }

  throw new Error(`All OpenRouter models failed. Last: ${lastError}`);
}

async function callGroq(
  messages: ChatMessage[],
  tools: ToolDef[]
): Promise<LLMResponse> {
  const groq = new Groq({ apiKey: GROQ_KEY });
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages as any,
    tools: tools.length > 0 ? (tools as any) : undefined,
    tool_choice: tools.length > 0 ? "auto" : undefined,
    temperature: 0.3,
    max_tokens: 2048,
  });

  const msg = response.choices[0].message;
  return {
    content: msg.content,
    tool_calls: (msg.tool_calls || []).map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    })),
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  tools: ToolDef[]
): Promise<LLMResponse> {
  if (GOOGLE_AI_KEY) {
    try {
      return await callGemini(messages, tools);
    } catch (error: any) {
      console.error("Gemini failed:", error.message);
    }
  }

  if (OPENROUTER_KEY) {
    try {
      return await callOpenRouter(messages, tools);
    } catch (error: any) {
      console.error("OpenRouter failed:", error.message);
    }
  }

  if (GROQ_KEY) {
    try {
      return await callGroq(messages, tools);
    } catch (error: any) {
      console.error("Groq failed:", error.message);
    }
  }

  throw new Error("All AI providers failed or none configured.");
}