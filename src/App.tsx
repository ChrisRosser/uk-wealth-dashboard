import { useMemo } from "react";
import { headlines, sources, resolveValue } from "./data";
import type { Basis } from "./types";
import { useNumber } from "./useNumber";
import WhereDoYouSit from "./components/WhereDoYouSit";
import TaxBurden from "./components/TaxBurden";
import TaxTake from "./components/TaxTake";
import TaxWealth from "./components/TaxWealth";

export default function App() {
  // Only the corrected (undercount-adjusted) figures are shown.
  const basis: Basis = "adjusted";

  // "You" wealth inputs live here so both the tax panel and "where do you sit"
  // share the same net wealth.
  const income = useNumber(35_000);
  const investments = useNumber(20_000);
  const homeEquity = useNumber(175_000);
  const investedWealth = investments.value ?? 0;
  const netWealth = investedWealth + (homeEquity.value ?? 0);

  // Which sources are referenced by the shown figures + the tax panel.
  const usedSourceIds = useMemo(() => {
    const ids = new Set<string>([
      "ons_etb",
      "advani_2023",
      "hmrc_income_tax_2025_26",
      "ubs_billionaire",
      "oxfam_takers",
      "obr_receipts",
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
        <p className="kicker">United Kingdom · wealth &amp; tax</p>
        <h1>Who owns the UK&apos;s wealth — and who pays the tax?</h1>
        <p className="lede">
          There is roughly <strong>£13.6 trillion</strong> of private wealth in Great
          Britain, and the system taxes income from work far more heavily than
          wealth. Start with your own numbers — every figure links to its source.
        </p>
      </header>

      <main>
        <TaxBurden
          income={income}
          investments={investments}
          homeEquity={homeEquity}
          investedWealth={investedWealth}
          netWealth={netWealth}
        />

        <section className="distribution">
          <h2>Who owns the wealth?</h2>

          <p className="toggle-note">
            The top-1% and top-0.1% shares are corrected for the survey&apos;s
            undercount of the very wealthy (Resolution Foundation, WID); the
            other figures are from the ONS survey.
          </p>

          <div className="cards">
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
          </div>
        </section>

        <WhereDoYouSit netWealth={netWealth} />

        <TaxTake />

        <TaxWealth />
      </main>

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
