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
    model: "gemini-2.5-flash-preview-05-20",
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

  try {
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
  } catch (error: any) {
    // Retry on rate limit with exponential backoff
    if (error.message?.includes("429") && retryCount < 3) {
      const waitTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
      console.log(`Gemini rate limited, retrying in ${waitTime}ms...`);
      await sleep(waitTime);
      return callGemini(messages, tools, retryCount + 1);
    }
    throw error;
  }
}

const OPENROUTER_MODELS = [
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
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

      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        lastError = `${model}: ${res.status} ${errorText}`;
        console.error(`OpenRouter ${model} failed:`, lastError);
        continue;
      }

      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) {
        lastError = `${model}: no message in response`;
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
      console.error(`OpenRouter ${model} error:`, error.message);
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
  // Try Gemini first (highest free tier)
  if (GOOGLE_AI_KEY) {
    try {
      return await callGemini(messages, tools);
    } catch (error: any) {
      console.error("Gemini failed:", error.message);
    }
  }

  // Try OpenRouter second (multiple free models)
  if (OPENROUTER_KEY) {
    try {
      return await callOpenRouter(messages, tools);
    } catch (error: any) {
      console.error("OpenRouter failed:", error.message);
    }
  }

  // Try Groq last
  if (GROQ_KEY) {
    try {
      return await callGroq(messages, tools);
    } catch (error: any) {
      console.error("Groq failed:", error.message);
    }
  }

  throw new Error(
    "All AI providers failed or none configured. Check your API keys."
  );
}