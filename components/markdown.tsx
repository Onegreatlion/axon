"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-base font-semibold text-zinc-200 mt-4 mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold text-zinc-200 mt-3 mb-1.5">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium text-zinc-300 mt-2 mb-1">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-sm text-zinc-300 leading-relaxed mb-2 last:mb-0">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-200">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-400">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-outside pl-4 space-y-1 mb-2 text-sm text-zinc-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside pl-4 space-y-1 mb-2 text-sm text-zinc-300">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-zinc-300 leading-relaxed">{children}</li>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-x-auto mb-2">
                <code className="text-xs font-mono text-zinc-300">
                  {children}
                </code>
              </pre>
            );
          }
          return (
            <code className="text-xs font-mono bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5 text-amber-400">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-amber-500/30 pl-3 my-2 text-sm text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-zinc-800 my-3" />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="w-full text-xs border border-zinc-800 rounded">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-zinc-900/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 text-left text-zinc-400 font-medium border-b border-zinc-800">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 text-zinc-300 border-b border-zinc-800/50">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}