import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props) => (
    <h1
      className="mb-6 text-3xl font-bold font-[family:var(--font-display)] tracking-tight text-[var(--kk-ink)]"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-10 mb-4 text-xl font-semibold text-[var(--kk-ink)]"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-8 mb-3 text-lg font-semibold text-[var(--kk-ink)]"
      {...props}
    />
  ),
  p: (props) => (
    <p className="mb-4 leading-relaxed text-[var(--kk-ink)]" {...props} />
  ),
  ul: (props) => (
    <ul className="mb-4 list-disc space-y-2 pl-5 text-[var(--kk-ink)]" {...props} />
  ),
  ol: (props) => (
    <ol className="mb-4 list-decimal space-y-2 pl-5 text-[var(--kk-ink)]" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="text-[var(--kk-ember)] underline decoration-[var(--kk-ember)]/30 underline-offset-2 hover:decoration-[var(--kk-ember)] transition-colors"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-6 border-l-3 border-[var(--kk-ember)] pl-4 italic text-[var(--kk-ash)]"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded-md bg-[var(--kk-smoke)] px-1.5 py-0.5 font-[family:var(--font-mono)] text-sm text-[var(--kk-ember-deep)]"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="my-6 overflow-x-auto rounded-[var(--kk-radius-md)] bg-[var(--kk-ink)] p-4 font-[family:var(--font-mono)] text-sm text-[var(--kk-cream)]"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-[var(--kk-smoke-heavy)]" />,
  strong: (props) => (
    <strong className="font-semibold text-[var(--kk-ink)]" {...props} />
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b border-[var(--kk-smoke-heavy)] px-3 py-2 text-left font-semibold text-[var(--kk-ink)]"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border-b border-[var(--kk-smoke)] px-3 py-2 text-[var(--kk-ink)]"
      {...props}
    />
  ),
};
