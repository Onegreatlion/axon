import Groq from "groq-sdk";

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
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

async function callGemini(
  messages: ChatMessage[],
  tools: ToolDef[]
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
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          let args = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {}
          parts.push({
            functionCall: { name: tc.function.name, args },
          });
        }
        geminiHistory.push({ role: "model", parts });
      } else {
        geminiHistory.push({
          role: "model",
          parts: [{ text: msg.content || "" }],
        });
      }
    } else if (msg.role === "tool") {
      let response = {};
      try {
        response = JSON.parse(msg.content);
      } catch {
        response = { result: msg.content };
      }

      const toolCall = messages.find(
        (m) =>
          m.role === "assistant" &&
          m.tool_calls?.some((tc: any) => tc.id === msg.tool_call_id)
      );
      const funcName =
        toolCall?.tool_calls?.find((tc: any) => tc.id === msg.tool_call_id)
          ?.function?.name || "unknown";

      pendingParts.push({
        functionResponse: { name: funcName, response },
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

  const chat = model.startChat({ history: geminiHistory.slice(0, -1) });
  const lastParts = geminiHistory[geminiHistory.length - 1]?.parts || [
    { text: "Continue." },
  ];

  const result = await chat.sendMessage(lastParts);
  const resp = result.response;
  const candidates = resp.candidates || [];
  const parts = candidates[0]?.content?.parts || [];

  const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
  const funcCalls = parts.filter((p: any) => p.functionCall);

  const toolCalls = funcCalls.map((fc: any, i: number) => ({
    id: `call_${Date.now()}_${i}`,
    type: "function" as const,
    function: {
      name: fc.functionCall.name,
      arguments: JSON.stringify(fc.functionCall.args || {}),
    },
  }));

  return {
    content: textParts.join("\n") || null,
    tool_calls: toolCalls,
  };
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
    max_tokens: 1024,
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
      console.error("Gemini failed, falling back to Groq:", error.message);
    }
  }

  if (GROQ_KEY) {
    return await callGroq(messages, tools);
  }

  throw new Error("No AI provider configured");
}