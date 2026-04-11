import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/src/lib/blog";
import { SITE_NAME } from "@/src/config/site";

export const metadata: Metadata = {
  title: "Blog",
  description: `Tips on budgeting, expense tracking, and managing money — in Hinglish. By ${SITE_NAME}.`,
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 font-[family:var(--font-body)]">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-sm text-[var(--kk-ember)] hover:underline"
        >
          ← Back to KharchaKitab
        </Link>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-[family:var(--font-display)] tracking-tight">
        Blog
      </h1>
      <p className="mb-10 text-[var(--kk-ash)]">
        Paisa, budget, aur smart spending — Hinglish mein.
      </p>

      {posts.length === 0 ? (
        <p className="text-[var(--kk-ash)]">Coming soon — stay tuned!</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="text-lg font-semibold group-hover:text-[var(--kk-ember)] transition-colors">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--kk-ash)]">
                  {post.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--kk-ash)]">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                  {post.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{post.tags.join(", ")}</span>
                    </>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-4 text-sm text-[var(--kk-ash)]">
        <Link href="/about" className="hover:text-[var(--kk-ember)] transition-colors">About</Link>
        <Link href="/features" className="hover:text-[var(--kk-ember)] transition-colors">Features</Link>
        <Link href="/privacy" className="hover:text-[var(--kk-ember)] transition-colors">Privacy</Link>
      </div>
    </main>
  );
}
