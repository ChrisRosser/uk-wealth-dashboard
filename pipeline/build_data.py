"""
UK Wealth Dashboard — data pipeline.

Fetches the ONS Wealth & Assets Survey "Total wealth" tables (openly licensed,
OGL v3.0) and computes the wealth distribution the frontend renders:

  - total private household wealth + composition        (ONS Table 2.1)
  - aggregate wealth per decile -> Lorenz curve          (ONS Table 2.2)
  - wealth Gini                                          (ONS Table 2.3)
  - a Pareto tail fitted to the top of the distribution  (from published
    percentile thresholds) to estimate the very top shares the survey
    cannot resolve on its own.

NO individuals are scraped. Everything traces to a citable source recorded in
sources.json. Figures that are not in the workbook (percentile thresholds, the
top-1% share, and the fiscal-data "adjusted" estimates) are curated constants,
each carrying the id of the publication it comes from — see CURATED below.

Run:  python pipeline/build_data.py
"""

from __future__ import annotations

import datetime as dt
import json
import math
import urllib.request
from pathlib import Path

import openpyxl

# --------------------------------------------------------------------------- #
# Paths & source
# --------------------------------------------------------------------------- #
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = Path(__file__).resolve().parent / "raw"
RAW.mkdir(parents=True, exist_ok=True)

ONS_XLSX_URL = (
    "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/"
    "personalandhouseholdfinances/incomeandwealth/datasets/"
    "totalwealthwealthingreatbritain/"
    "july2006tojune2016andapril2014tomarch2022/totalwealthtables.xlsx"
)
ONS_XLSX = RAW / "totalwealthtables.xlsx"

# The workbook column we want. Matched on the period header so this keeps
# working when ONS appends a newer round.
TARGET_PERIOD = "April 2020"          # matches "April 2020 to March 2022"
PERIOD_LABEL = "2020-04/2022-03"
PERIOD_HUMAN = "April 2020 to March 2022"

# --------------------------------------------------------------------------- #
# Curated constants (NOT in the workbook) — each cites its source id.
# Percentile thresholds and the top-1% share are published in the ONS bulletin
# text; the "adjusted" figures come from fiscal-data research.
# --------------------------------------------------------------------------- #
CURATED = {
    # ONS "Household total wealth in GB, Apr 2020-Mar 2022" bulletin
    "p10": 16_500,
    "p50": 293_700,
    "p90": 1_200_500,       # top-10% entry threshold
    "p99": 3_121_500,       # top-1% entry threshold
    "top1_share_survey": 0.10,        # ONS: wealthiest 1% hold 10%
    # Fiscal-data adjusted estimates
    "top1_share_adjusted": 0.23,      # Advani, Bangham & Leslie (2020)
    "top01_share_adjusted": 0.09,     # WID.world (UK, net personal wealth)
}

SOURCES = {
    "ons_was_r8": {
        "title": "Total wealth: Wealth in Great Britain (Table 2.1-2.3), "
                 "April 2020 to March 2022",
        "publisher": "Office for National Statistics",
        "published": "2025-01-24",
        "licence": "Open Government Licence v3.0",
        "url": ONS_XLSX_URL,
        "caveat": "OSR suspended this survey's accredited official statistics "
                  "status in June 2025 over undercount/quality concerns.",
    },
    "ons_was_r8_bulletin": {
        "title": "Household total wealth in Great Britain: "
                 "April 2020 to March 2022",
        "publisher": "Office for National Statistics",
        "published": "2025-01-24",
        "licence": "Open Government Licence v3.0",
        "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/"
               "personalandhouseholdfinances/incomeandwealth/bulletins/"
               "totalwealthingreatbritain/april2020tomarch2022",
    },
    "ons_pareto": {
        "title": "Pareto tail fitted to ONS top-decile thresholds "
                 "(top 0.1% not resolved by the survey)",
        "publisher": "This project (derived from ONS data)",
        "licence": "Derived; method documented in pipeline/build_data.py",
        "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/"
               "personalandhouseholdfinances/incomeandwealth/bulletins/"
               "totalwealthingreatbritain/april2020tomarch2022",
    },
    "advani_2020": {
        "title": "The UK's wealth distribution and characteristics of "
                 "high-wealth households",
        "authors": "Advani, Bangham & Leslie",
        "publisher": "Resolution Foundation / Wealth Tax Commission",
        "published": "2020-12",
        "licence": "Cite with attribution; do not republish in full.",
        "url": "https://www.resolutionfoundation.org/app/uploads/2020/12/"
               "The-UKs-wealth-distribution.pdf",
    },
    "wid_uk": {
        "title": "United Kingdom — World Inequality Database",
        "publisher": "WID.world",
        "licence": "Check terms; attribution required.",
        "url": "https://wid.world/country/united-kingdom/",
    },
    "osr_suspension": {
        "title": "OSR suspend accreditation of Wealth and Assets Survey",
        "publisher": "Office for Statistics Regulation",
        "published": "2025-06",
        "url": "https://osr.statisticsauthority.gov.uk/news/"
               "osr-suspend-accreditation-of-wealth-and-assets-survey/",
    },
    # --- used by build_tax.py (kept here so sources.json carries every id) ---
    "ons_etb": {
        "title": "Effects of taxes and benefits on UK household income: "
                 "financial year ending 2024 (Table 8)",
        "publisher": "Office for National Statistics",
        "published": "2025-09-25",
        "licence": "Open Government Licence v3.0",
        "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/"
               "personalandhouseholdfinances/incomeandwealth/bulletins/"
               "theeffectsoftaxesandbenefitsonhouseholdincome/2024",
    },
    "advani_2023": {
        "title": "How much tax do the rich really pay? Evidence from the UK",
        "authors": "Advani, Hughson & Summers",
        "publisher": "Oxford Review of Economic Policy / LSE III / CAGE",
        "published": "2023",
        "licence": "Cite with attribution.",
        "url": "https://academic.oup.com/oxrep/article/39/3/406/7245704",
    },
    "hmrc_income_tax_2025_26": {
        "title": "Income Tax rates and Personal Allowances (2025/26)",
        "publisher": "GOV.UK / HMRC",
        "licence": "Open Government Licence v3.0",
        "url": "https://www.gov.uk/income-tax-rates",
    },
    "ubs_billionaire": {
        "title": "Billionaire Ambitions Report — billionaire wealth +121% over "
                 "the decade to $14tn (~8%/yr; 10%/yr 2015-20)",
        "publisher": "UBS",
        "published": "2024",
        "licence": "Cite with attribution.",
        "url": "https://www.ubs.com/global/en/media/display-page-ndp/"
               "en-20251204-billionaire-ambitions-report-2025.html",
    },
    "oxfam_takers": {
        "title": "Takers Not Makers — billionaire wealth grew by $2 trillion "
                 "(~15%) in 2024",
        "publisher": "Oxfam",
        "published": "2025-01",
        "licence": "Cite with attribution.",
        "url": "https://www.oxfam.org/en/press-releases/"
               "billionaire-wealth-surges-2-trillion-2024-three-times-faster-"
               "year-while-number",
    },
    "obr_receipts": {
        "title": "Public sector current receipts £1,139bn in 2024-25 "
                 "(40.9% of national income)",
        "publisher": "Office for Budget Responsibility",
        "published": "2025",
        "licence": "Cite with attribution.",
        "url": "https://obr.uk/forecasts-in-depth/brief-guides-and-explainers/"
               "public-finances/",
    },
}


# --------------------------------------------------------------------------- #
# Fetch + parse
# --------------------------------------------------------------------------- #
def fetch() -> None:
    if ONS_XLSX.exists():
        print(f"[fetch] cached {ONS_XLSX.name}")
        return
    print(f"[fetch] downloading {ONS_XLSX_URL}")
    req = urllib.request.Request(ONS_XLSX_URL, headers={"User-Agent": "Mozilla/5.0"})
    ONS_XLSX.write_bytes(urllib.request.urlopen(req, timeout=90).read())
    print(f"[fetch] wrote {ONS_XLSX.stat().st_size} bytes")


def _load_sheet(wb, name: str) -> list[tuple]:
    return list(wb[name].iter_rows(values_only=True))


def _target_col(rows: list[tuple]) -> int:
    """Find the column index whose period header matches TARGET_PERIOD."""
    for row in rows[:6]:
        for j, cell in enumerate(row):
            if cell and TARGET_PERIOD in str(cell):
                return j
    raise ValueError(f"Period column {TARGET_PERIOD!r} not found")


def _num(v) -> float:
    if isinstance(v, (int, float)):
        return float(v)
    raise ValueError(f"expected number, got {v!r}")


def parse_workbook() -> dict:
    wb = openpyxl.load_workbook(ONS_XLSX, read_only=True, data_only=True)

    t21 = _load_sheet(wb, "Table 2.1")
    t22 = _load_sheet(wb, "Table 2.2")
    t23 = _load_sheet(wb, "Table 2.3")
    col = _target_col(t21)
    print(f"[parse] using column {col} ({PERIOD_HUMAN})")

    # --- Table 2.1: total wealth (incl pension) + composition % --------------
    total_bn = None
    comp = {}
    seen_pct_block = False
    for row in t21:
        c0 = (row[0] or "")
        c1 = (row[1] or "")
        if isinstance(c1, str) and c1.startswith("Total Wealth (including"):
            if total_bn is None:  # first occurrence = £bn aggregate block
                total_bn = _num(row[col])
        if isinstance(c0, str) and c0.startswith("Percentage of Total Wealth"):
            seen_pct_block = True
        if seen_pct_block and len(comp) < 4 and isinstance(c1, str):
            key = {
                "Property Wealth (net)": "property",
                "Financial Wealth (net)": "financial",
                "Physical Wealth": "physical",
                "Private Pension Wealth": "pension",
            }.get(c1.strip())
            if key and key not in comp:
                comp[key] = round(_num(row[col]) / 100.0, 4)

    # --- Table 2.2: aggregate wealth per decile (£ million) ------------------
    deciles: list[float] = []
    for row in t22:
        c1 = row[1]
        if isinstance(c1, str) and c1.strip().startswith("Total Wealth Decile"):
            if len(deciles) < 10:  # first block is the total-wealth deciles
                deciles.append(_num(row[col]))
    if len(deciles) != 10:
        raise ValueError(f"expected 10 deciles, got {len(deciles)}")

    # --- Table 2.3: total-wealth Gini ----------------------------------------
    gini = None
    for row in t23:
        if isinstance(row[1], str) and row[1].strip() == "Total Wealth":
            gini = round(_num(row[col]), 3)  # first match is the Gini block
            break

    total_m = sum(deciles)
    return {"total_bn": total_bn, "composition": comp,
            "deciles_m": deciles, "total_m": total_m, "gini": gini}


# --------------------------------------------------------------------------- #
# Derive distribution
# --------------------------------------------------------------------------- #
def lorenz_from_deciles(deciles_m: list[float]) -> list[list[float]]:
    total = sum(deciles_m)
    pts = [[0.0, 0.0]]
    cum = 0.0
    for i, v in enumerate(deciles_m, start=1):
        cum += v
        pts.append([round(i / 10, 2), round(cum / total, 5)])
    return pts


def fit_pareto(p90: float, p99: float) -> float:
    """Pareto index alpha from two upper thresholds:
        share-above ∝ wealth^(-alpha)  =>  alpha = ln(p1/p2) / ln(W2/W1)
    Population above p90 = 0.10, above p99 = 0.01."""
    return math.log(0.10 / 0.01) / math.log(p99 / p90)


def top_share_within_top1(alpha: float, frac_of_top1: float) -> float:
    """For a Pareto tail, the share of the top-1% *wealth* held by the top
    `frac_of_top1` of that group is frac^((alpha-1)/alpha)."""
    return frac_of_top1 ** ((alpha - 1) / alpha)


# --------------------------------------------------------------------------- #
# Assemble + emit
# --------------------------------------------------------------------------- #
def tn(bn: float) -> str:
    return f"£{bn / 1000:.1f} trillion"


def build() -> None:
    fetch()
    d = parse_workbook()

    total_bn = d["total_bn"]
    gini = d["gini"]
    comp = d["composition"]
    lorenz = lorenz_from_deciles(d["deciles_m"])
    bottom50 = lorenz[5][1]            # cumulative share at population 0.5
    top10 = round(1 - lorenz[9][1], 4)  # 1 - share of bottom 90%

    alpha = fit_pareto(CURATED["p90"], CURATED["p99"])
    # top 0.1% is 1/10 of the top 1% by population
    top01_of_top1 = top_share_within_top1(alpha, 0.1)
    top01_survey = round(CURATED["top1_share_survey"] * top01_of_top1, 4)
    p999 = round(CURATED["p99"] * (0.01 / 0.001) ** (1 / alpha))  # top-0.1% threshold

    # Insert the published top-1% point into the Lorenz curve (pop 0.99).
    lorenz_full = lorenz[:10] + [
        [0.99, round(1 - CURATED["top1_share_survey"], 5)],
        lorenz[10],
    ]

    print(f"[derive] total {tn(total_bn)}  gini {gini}  "
          f"bottom50 {bottom50:.3f}  top10 {top10:.3f}")
    print(f"[derive] pareto alpha {alpha:.3f}  "
          f"top0.1% (survey-extrapolated) {top01_survey:.3f}  "
          f"p99.9 ~£{p999/1e6:.1f}m")

    generated = dt.date.today().isoformat()

    headlines = {
        "meta": {
            "generated": generated,
            "pipelineVersion": "1.0.0",
            "period": PERIOD_LABEL,
            "source": "ONS Wealth & Assets Survey Round 8 + fitted Pareto tail",
        },
        "figures": [
            {
                "id": "total_household_wealth_gb",
                "label": "Total private household wealth (GB)",
                "value": round(total_bn * 1e9),
                "valueDisplay": tn(total_bn),
                "geography": "GB", "unit": "household", "basis": "survey",
                "period": PERIOD_LABEL, "sourceId": "ons_was_r8",
                "note": "Great Britain only; excludes Northern Ireland.",
            },
            {
                "id": "top1_share",
                "label": "Share held by the wealthiest 1%",
                "geography": "GB", "unit": "household",
                "views": {
                    "survey": {
                        "value": CURATED["top1_share_survey"],
                        "valueDisplay": f"{CURATED['top1_share_survey']*100:.0f}%",
                        "sourceId": "ons_was_r8_bulletin",
                    },
                    "adjusted": {
                        "value": CURATED["top1_share_adjusted"],
                        "valueDisplay": f"{CURATED['top1_share_adjusted']*100:.0f}%",
                        "sourceId": "advani_2020",
                    },
                },
                "note": "The survey undercounts the top; fiscal-data "
                        "adjustment more than doubles their measured share.",
            },
            {
                "id": "top01_share",
                "label": "Share held by the wealthiest 0.1%",
                "geography": "GB/UK", "unit": "household",
                "views": {
                    "survey": {
                        "value": top01_survey,
                        "valueDisplay": f"~{top01_survey*100:.0f}%",
                        "sourceId": "ons_pareto",
                    },
                    "adjusted": {
                        "value": CURATED["top01_share_adjusted"],
                        "valueDisplay": f"~{CURATED['top01_share_adjusted']*100:.0f}%",
                        "sourceId": "wid_uk",
                    },
                },
                "note": "Survey figure is a Pareto extrapolation of the ONS "
                        "tail; fiscal-data (WID) puts it far higher — the gap "
                        "IS the hidden wealth at the very top.",
            },
            {
                "id": "top10_share",
                "label": "Share held by the wealthiest 10%",
                "value": top10,
                "valueDisplay": f"{top10*100:.0f}%",
                "geography": "GB", "unit": "household", "basis": "survey",
                "sourceId": "ons_was_r8",
                "note": "Computed from ONS aggregate wealth by decile.",
            },
            {
                "id": "bottom50_share",
                "label": "Share held by the least wealthy 50%",
                "value": round(bottom50, 4),
                "valueDisplay": f"~{bottom50*100:.0f}%",
                "geography": "GB", "unit": "household", "basis": "survey",
                "sourceId": "ons_was_r8",
                "note": "About the same slice the wealthiest 1% hold.",
            },
            {
                "id": "wealth_gini",
                "label": "Wealth Gini (GB households)",
                "value": gini,
                "valueDisplay": f"{gini}",
                "geography": "GB", "unit": "household", "basis": "survey",
                "sourceId": "ons_was_r8",
                "note": "Income Gini is ~0.36 — wealth is far more concentrated.",
            },
        ],
    }

    distribution = {
        "meta": {
            "generated": generated,
            "period": PERIOD_LABEL,
            "sourceId": "ons_was_r8",
            "geography": "GB", "unit": "household",
            "totalWealthGbp": round(total_bn * 1e9),
        },
        "thresholds": {
            "p10": CURATED["p10"], "p50": CURATED["p50"],
            "p90": CURATED["p90"], "p99": CURATED["p99"], "p999": p999,
        },
        "composition": comp,
        "decilesAggregateGbpMillion": [round(x) for x in d["deciles_m"]],
        "lorenz": lorenz_full,
        "paretoTail": {
            "alpha": round(alpha, 4),
            "fitFrom": "p90/p99 thresholds",
            "impliedTop01ShareSurvey": top01_survey,
            "impliedTop01ThresholdGbp": p999,
            "method": "share-above ∝ wealth^(-alpha)",
        },
    }

    validate(headlines, distribution)
    _write(DATA / "headlines.json", headlines)
    _write(DATA / "distribution.json", distribution)
    _write(DATA / "sources.json", SOURCES)
    print("[emit] wrote headlines.json, distribution.json, sources.json")


def validate(headlines: dict, distribution: dict) -> None:
    ids = set(SOURCES)
    # every referenced sourceId must exist
    refs: list[str] = []
    for f in headlines["figures"]:
        if "sourceId" in f:
            refs.append(f["sourceId"])
        for v in f.get("views", {}).values():
            refs.append(v["sourceId"])
    missing = sorted(set(refs) - ids)
    if missing:
        raise SystemExit(f"[validate] FAIL: missing sources: {missing}")

    lz = distribution["lorenz"]
    if lz[0] != [0.0, 0.0] or lz[-1][0] != 1.0:
        raise SystemExit("[validate] FAIL: Lorenz must span [0,0]..[1.0,*]")
    xs = [p[0] for p in lz]
    ys = [p[1] for p in lz]
    if xs != sorted(xs) or ys != sorted(ys):
        raise SystemExit("[validate] FAIL: Lorenz not monotonic")
    if abs(ys[-1] - 1.0) > 1e-6:
        raise SystemExit("[validate] FAIL: Lorenz must reach 1.0")
    comp_sum = sum(distribution["composition"].values())
    if abs(comp_sum - 1.0) > 0.02:
        raise SystemExit(f"[validate] FAIL: composition sums to {comp_sum}")
    print("[validate] OK")


def _write(path: Path, obj: dict) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8")


if __name__ == "__main__":
    build()
