import { useMemo, useState } from "react";
import { headlines, sources, resolveValue } from "./data";
import type { Basis } from "./types";
import WhereDoYouSit from "./components/WhereDoYouSit";
import TaxBurden from "./components/TaxBurden";

export default function App() {
  const [basis, setBasis] = useState<Basis>("survey");

  // Which sources are referenced by the shown figures + the tax panel.
  const usedSourceIds = useMemo(() => {
    const ids = new Set<string>([
      "ons_etb",
      "advani_2023",
      "hmrc_income_tax_2025_26",
    ]);
    for (const f of headlines.figures) {
      const r = resolveValue(f, basis);
      if (r?.sourceId) ids.add(r.sourceId);
    }
    return [...ids];
  }, [basis]);

  return (
    <div className="page">
      <header className="masthead">
        <p className="kicker">Great Britain · Wealth &amp; Assets Survey</p>
        <h1>Who owns the UK&apos;s wealth?</h1>
        <p className="lede">
          There is roughly <strong>£13.6 trillion</strong> of private wealth in Great
          Britain. It is not shared evenly. This dashboard is built entirely from
          published ONS and academic data — every figure links to its source.
        </p>

        <div className="toggle" role="group" aria-label="Data basis">
          <button
            className={basis === "survey" ? "active" : ""}
            onClick={() => setBasis("survey")}
          >
            Official survey
          </button>
          <button
            className={basis === "adjusted" ? "active" : ""}
            onClick={() => setBasis("adjusted")}
          >
            Adjusted for undercount
          </button>
        </div>
        <p className="toggle-note">
          {basis === "survey"
            ? "ONS Wealth & Assets Survey — accurate for most households, but it misses the very top."
            : "Corrected using HMRC/Rich List data (Resolution Foundation, WID). The top's share jumps."}
        </p>
      </header>

      <main className="cards">
        {headlines.figures.map((f) => {
          const r = resolveValue(f, basis);
          if (!r) return null;
          return (
            <article className="card" key={f.id}>
              <p className="card-value">{r.valueDisplay}</p>
              <p className="card-label">{f.label}</p>
              {f.note && <p className="card-note">{f.note}</p>}
              <p className="card-tags">
                <span>{f.geography}</span>
                <span>{f.unit}</span>
                {f.views && <span>{basis}</span>}
              </p>
            </article>
          );
        })}
      </main>

      <WhereDoYouSit />

      <TaxBurden />

      <section className="sources">
        <h2>Sources</h2>
        <ul>
          {usedSourceIds.map((id) => {
            const s = sources[id];
            if (!s) return null;
            return (
              <li key={id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>{" "}
                — {s.publisher}
                {s.published ? `, ${s.published}` : ""}
                {s.licence && (
                  <>
                    {" "}
                    · <span className="licence">{s.licence}</span>
                  </>
                )}
                {s.caveat && <span className="caveat"> ⚠ {s.caveat}</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="foot">
        <p>
          Seed build ({headlines.meta.generated}). Open source · figures regenerated
          by the data pipeline, not scraped from individuals.
        </p>
      </footer>
    </div>
  );
}
