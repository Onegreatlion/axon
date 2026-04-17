import Groq from "groq-sdk";

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface LLMResponse {
  content: string | null;
  tool_calls: {
    id: string;
    type: "function";
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

  const geminiTools = tools.length > 0 ? [{
    functionDeclarations: tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    })),
  }] : undefined;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Using 2.5 for better quota and tool calling
    systemInstruction: systemMsg?.content || undefined,
    tools: geminiTools,
  });

  let geminiHistory: any[] = [];
  let pendingParts: any[] = [];

  for (const msg of chatMessages) {
    if (msg.role === "user") {
      if (pendingParts.length > 0) {
        geminiHistory.push({ role: "model", parts: [...pendingParts] });
        pendingParts = [];
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
      // EXACT FIX FOR THE 400 ERROR:
      let outputObj = {};
      try { outputObj = JSON.parse(msg.content); } catch { outputObj = { result: msg.content }; }
      
      const toolCall = messages.find((m) => m.role === "assistant" && m.tool_calls?.some((tc: any) => tc.id === msg.tool_call_id));
      const funcName = toolCall?.tool_calls?.find((tc: any) => tc.id === msg.tool_call_id)?.function?.name || "unknown";
      
      pendingParts.push({
        functionResponse: { 
          name: funcName, 
          response: outputObj // Gemini requires the key to be exactly "response", containing an object
        },
      });
    }
  }

  if (pendingParts.length > 0) {
    geminiHistory.push({ role: "user", parts: [...pendingParts] });
  }

  // SMART CONTEXT: Summarize old messages to prevent crashes on 100+ turns
  let trimmedHistory = geminiHistory;
  if (geminiHistory.length > 30) {
    const recentMessages = geminiHistory.slice(geminiHistory.length - 20);
    const contextSummary = {
      role: "user",
      parts: [{ text: `[SYSTEM: 30+ messages omitted for context length. Please continue smoothly.]` }]
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
    if (error.message?.includes("429") && retryCount < 2) {
      await sleep(2000 * (retryCount + 1));
      return callGemini(messages, tools, retryCount + 1);
    }
    throw error;
  }
}

async function callOpenRouter(messages: ChatMessage[], tools: ToolDef[]): Promise<LLMResponse> {
  // Prioritized models that actually excel at tool calling
  const OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
  ];

  let lastError = "";
  for (const model of OPENROUTER_MODELS) {
    try {
      const body: any = { model, messages, temperature: 0.3, max_tokens: 2048 };
      if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = "auto";
      }
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${model} failed`);
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) continue;
      
      return {
        content: msg.content || null,
        tool_calls: (msg.tool_calls || []).map((tc: any) => ({
          id: tc.id || `call_${Date.now()}`,
          type: "function" as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      };
    } catch (e: any) {
      lastError = e.message;
      continue;
    }
  }
  throw new Error(`OpenRouter failed: ${lastError}`);
}

export async function chatCompletion(messages: ChatMessage[], tools: ToolDef[]): Promise<LLMResponse> {
  if (GOOGLE_AI_KEY) {
    try { return await callGemini(messages, tools); } catch (e) { console.error("Gemini failed"); }
  }
  if (OPENROUTER_KEY) {
    try { return await callOpenRouter(messages, tools); } catch (e) { console.error("OpenRouter failed"); }
  }
  throw new Error("All AI providers failed. Rate limits exceeded.");
}