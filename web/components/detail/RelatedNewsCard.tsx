"use client";

import { useEffect, useMemo, useState } from "react";

type RelatedNewsItem = {
  title: string;
  url: string;
  date: string;
  excerpt: string;
  meta: string;
  score?: number;
};

type RelatedNewsCardProps = {
  name?: string | null;
  group?: string | null;
  country?: string | null;
  owner?: string | null;
};

function cleanText(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function stripCompanySuffixes(value: string) {
  return cleanText(
    value
      .replace(/\btechnologies\b/gi, "")
      .replace(/\btechnology\b/gi, "")
      .replace(/\benergy\b/gi, "")
      .replace(/\bpower\b/gi, "")
      .replace(/\binc\b\.?/gi, "")
      .replace(/\bcorp\b\.?/gi, "")
      .replace(/\bcorporation\b/gi, "")
      .replace(/\bgroup\b/gi, "")
      .replace(/\bltd\b\.?/gi, "")
      .replace(/\bllc\b/gi, "")
      .replace(/\bag\b/gi, "")
      .replace(/\bgmbh\b/gi, "")
      .replace(/\bs\.a\.\b/gi, "")
      .replace(/\bsa\b/gi, "")
  );
}

function buildSearchTerms({
  name,
  group,
  owner,
}: {
  name?: string | null;
  group?: string | null;
  owner?: string | null;
}) {
  const rawValues = [cleanText(name), cleanText(group), cleanText(owner)].filter(
    Boolean
  ) as string[];

  const terms = new Set<string>();

  for (const value of rawValues) {
    terms.add(value);

    const stripped = stripCompanySuffixes(value);
    if (stripped && stripped.length >= 3) terms.add(stripped);

    const firstWord = value.split(/\s+/)[0]?.trim();
    if (firstWord && firstWord.length >= 3) terms.add(firstWord);

    const strippedFirstWord = stripped.split(/\s+/)[0]?.trim();
    if (strippedFirstWord && strippedFirstWord.length >= 3) {
      terms.add(strippedFirstWord);
    }
  }

  return Array.from(terms);
}

function dedupeNews(items: RelatedNewsItem[]) {
  const seen = new Set<string>();
  const result: RelatedNewsItem[] = [];

  for (const item of items) {
    const key = `${item.url}__${item.title}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function toTimestamp(dateValue?: string | null) {
  if (!dateValue) return 0;
  const ts = new Date(dateValue).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export default function RelatedNewsCard({
  name,
  group,
  country,
  owner,
}: RelatedNewsCardProps) {
  const [items, setItems] = useState<RelatedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const searchTerms = useMemo(
    () =>
      buildSearchTerms({
        name,
        group,
        owner,
      }),
    [name, group, owner]
  );

  const fullNewsUrl = useMemo(() => {
    const rawPrimary =
      cleanText(name) || cleanText(group) || cleanText(owner) || "";

    const simplifiedPrimary =
      stripCompanySuffixes(cleanText(name)) ||
      stripCompanySuffixes(cleanText(group)) ||
      stripCompanySuffixes(cleanText(owner)) ||
      rawPrimary;

    const bestQuery =
      simplifiedPrimary ||
      rawPrimary ||
      searchTerms[0] ||
      "";

    if (!bestQuery) {
      return "https://www.thinkgeoenergy.com/";
    }

    return `https://www.thinkgeoenergy.com/?s=${encodeURIComponent(bestQuery)}`;
  }, [name, group, owner, searchTerms]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (name) params.set("name", name);
    if (group) params.set("group", group);
    if (country) params.set("country", country);
    if (owner) params.set("owner", owner);

    if (searchTerms.length > 0) {
      params.set("aliases", searchTerms.join("|"));
    }

    fetch(`/api/related-news?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data) ? data : [];

        const cleaned = dedupeNews(parsed).sort((a, b) => {
          const dateDiff = toTimestamp(b.date) - toTimestamp(a.date);
          if (dateDiff !== 0) return dateDiff;
          return (b.score || 0) - (a.score || 0);
        });

        setItems(cleaned);
      })
      .catch((error) => {
        console.error("Failed to load related news", error);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name, group, country, owner, searchTerms]);

  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="flex min-h-[56px] items-center justify-between border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6">
        <h2 className="text-xl font-bold leading-none text-[var(--tge-text-primary)]">
          Related News
        </h2>

        <a
          href={fullNewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-semibold text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]"
        >
          View all on ThinkGeoEnergy
        </a>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="text-sm text-[var(--tge-governance-muted-text)]">
            Loading related news…
          </div>
        ) : items.length === 0 ? (
          <div className="space-y-2 text-sm leading-6 text-[var(--tge-text-secondary)]">
            <p>No related ThinkGeoEnergy news found.</p>
            <p className="text-[var(--tge-governance-muted-text)]">
              This version searches using company name, simplified company name,
              group, owner, and related aliases.
            </p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <article
                key={`${item.url}-${item.title}`}
                className="border-b border-[var(--tge-governance-neutral-border)] py-2.5 last:border-none"
              >
                {item.meta ? (
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                    {item.meta}
                  </div>
                ) : null}

                <div className="mt-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-semibold leading-snug text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)]"
                  >
                    {item.title}
                  </a>
                </div>

                {item.excerpt ? (
                  <p className="mt-1 text-[12px] leading-snug text-[var(--tge-text-secondary)]">
                    {item.excerpt}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
