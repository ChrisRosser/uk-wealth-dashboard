import type { TaxData } from "./types";

export interface TaxBreakdown {
  incomeTax: number;
  nationalInsurance: number;
  capitalGainsTax: number;
  dividendTax: number;
  vatAndDuties: number;
  councilTax: number;
  total: number;
  economicIncome: number;
  pctOfIncome: number;
  pctOfWealth: number | null;
}

export interface HouseholdOpts {
  /** % of wealth that is invested / income-generating (rest = home + pension). */
  investedSharePct?: number;
  /** annual return on that invested wealth. */
  economicReturnPct?: number;
}

export interface BillionaireResult {
  wealth: number;
  economicIncome: number; // total annual return incl. unrealised
  realisedTaxable: number;
  incomeTax: number;
  nationalInsurance: number;
  capitalGainsTax: number;
  dividendTax: number;
  vatAndDuties: number;
  councilTax: number;
  total: number;
  pctOfEconomicIncome: number;
  pctOfWealth: number;
}

/** A single "rate × base" slice of a tax calculation, for display. */
export interface TaxStep {
  rate: number;
  base: number;
}

/** UK income tax (England 2025/26) broken into bands, with PA taper. */
export function incomeTaxSteps(
  gross: number,
  cfg: TaxData["incomeTax2025_26"]
): { allowance: number; taxable: number; steps: TaxStep[] } {
  let allowance = cfg.personalAllowance;
  if (gross > cfg.paTaperStart) {
    allowance = Math.max(0, allowance - (gross - cfg.paTaperStart) / 2);
  }
  const taxable = Math.max(0, gross - allowance);

  // Band thresholds are stated on GROSS income; shift to the taxable base.
  const basicTop = cfg.bands[1].threshold - cfg.personalAllowance;
  const higherTop = cfg.bands[2].threshold - cfg.personalAllowance;

  const steps: TaxStep[] = [];
  const basic = Math.min(taxable, basicTop);
  if (basic > 0) steps.push({ rate: cfg.bands[0].rate, base: basic });
  if (taxable > basicTop)
    steps.push({ rate: cfg.bands[1].rate, base: Math.min(taxable, higherTop) - basicTop });
  if (taxable > higherTop)
    steps.push({ rate: cfg.bands[2].rate, base: taxable - higherTop });
  return { allowance, taxable, steps };
}

export function incomeTax(gross: number, cfg: TaxData["incomeTax2025_26"]): number {
  return incomeTaxSteps(gross, cfg).steps.reduce((s, b) => s + b.base * b.rate, 0);
}

/** Employee Class 1 National Insurance, 2025/26, broken into bands. */
export function niSteps(
  gross: number,
  ni: TaxData["incomeTax2025_26"]["ni"]
): TaxStep[] {
  if (gross <= ni.primaryThreshold) return [];
  const main = Math.min(gross, ni.upperEarningsLimit) - ni.primaryThreshold;
  const steps: TaxStep[] = [{ rate: ni.mainRate, base: main }];
  if (gross > ni.upperEarningsLimit)
    steps.push({ rate: ni.upperRate, base: gross - ni.upperEarningsLimit });
  return steps;
}

export function nationalInsurance(
  gross: number,
  ni: TaxData["incomeTax2025_26"]["ni"]
): number {
  return niSteps(gross, ni).reduce((s, b) => s + b.base * b.rate, 0);
}

/** Piecewise-linear interpolation with clamping at both ends. */
function interp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      const f = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + f * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

/**
 * Effective tax burden for a household with the given income and wealth.
 * Income tax + NI are COMPUTED from bands. VAT/duties and council tax cannot
 * be derived from income alone, so they are imputed from ONS ETB rates for a
 * household at this income level (regressive: higher share for lower incomes).
 */
export function taxForHousehold(
  income: number,
  wealth: number,
  t: TaxData,
  opts: HouseholdOpts = {}
): TaxBreakdown {
  const b = t.billionaire;
  const investedShare = opts.investedSharePct ?? 0;
  const returnPct = opts.economicReturnPct ?? b.economicReturnPct;

  const it = incomeTax(income, t.incomeTax2025_26);
  const ni = nationalInsurance(income, t.incomeTax2025_26.ni);

  const xs = t.quintiles.representativeIncomeGbp;
  const vatAndDuties = income * (interp(income, xs, t.quintiles.indirectPctGross) / 100);
  const councilTax = income * (interp(income, xs, t.quintiles.councilPctGross) / 100);

  // Wealth marked as "invested" generates capital income, taxed exactly like
  // the billionaire's. Home + pension (the rest) generates none. Default 0%.
  const investedWealth = wealth * (investedShare / 100);
  const realisedTaxable = investedWealth * (b.realisedTaxableYieldPct / 100);
  const gains = realisedTaxable * (b.realisedGainsSharePct / 100);
  const dividends = realisedTaxable - gains;
  const capitalGainsTax = gains * (b.cgtRatePct / 100);
  const dividendTax = dividends * (b.dividendRatePct / 100);
  const investmentIncome = investedWealth * (returnPct / 100);

  const total = it + ni + capitalGainsTax + dividendTax + vatAndDuties + councilTax;
  const economicIncome = income + investmentIncome;
  return {
    incomeTax: it,
    nationalInsurance: ni,
    capitalGainsTax,
    dividendTax,
    vatAndDuties,
    councilTax,
    total,
    economicIncome,
    pctOfIncome: total / economicIncome,
    pctOfWealth: wealth > 0 ? total / wealth : null,
  };
}

/**
 * The "poorest billionaire" benchmark, built bottom-up from explicit
 * assumptions so it produces the SAME line items as a normal household bill.
 */
export function billionaire(
  t: TaxData,
  economicReturnPct: number = t.billionaire.economicReturnPct
): BillionaireResult {
  const b = t.billionaire;
  const wealth = b.wealthGbp;
  const economicIncome = wealth * (economicReturnPct / 100);
  const realisedTaxable = wealth * (b.realisedTaxableYieldPct / 100);

  const gains = realisedTaxable * (b.realisedGainsSharePct / 100);
  const dividends = realisedTaxable - gains;

  const it = incomeTax(b.salaryGbp, t.incomeTax2025_26);
  const ni = nationalInsurance(b.salaryGbp, t.incomeTax2025_26.ni);
  const capitalGainsTax = gains * (b.cgtRatePct / 100);
  const dividendTax = dividends * (b.dividendRatePct / 100);
  const vatAndDuties = b.annualSpendingGbp * (b.vatEffectivePct / 100);
  const councilTax = b.councilTaxGbp;

  const total = it + ni + capitalGainsTax + dividendTax + vatAndDuties + councilTax;
  return {
    wealth,
    economicIncome,
    realisedTaxable,
    incomeTax: it,
    nationalInsurance: ni,
    capitalGainsTax,
    dividendTax,
    vatAndDuties,
    councilTax,
    total,
    pctOfEconomicIncome: total / economicIncome,
    pctOfWealth: total / wealth,
  };
}

/** Population effective-rate curve (income, all-taxes % of gross) as fractions. */
export function ordinaryCurve(t: TaxData): [number, number][] {
  return t.quintiles.representativeIncomeGbp.map((inc, i) => [
    inc,
    t.quintiles.allTaxesPctGross[i] / 100,
  ]);
}

/**
 * One continuous effective-tax-rate curve across the whole income range:
 *   - ONS all-taxes as a share of gross income (ordinary households), then
 *   - Advani/Summers effective rates on remuneration at the top, then
 *   - the billionaire endpoint.
 * These are different tax scopes but each is a genuine effective rate, and they
 * meet at ~36% near £100k. Returned sorted by income, rates as fractions.
 */
export function effectiveRateCurve(
  t: TaxData,
  bill: BillionaireResult
): [number, number][] {
  const reps = t.quintiles.representativeIncomeGbp;
  const onsMax = reps[reps.length - 1];
  const pts: [number, number][] = [];
  for (const [inc, r] of ordinaryCurve(t)) pts.push([inc, r]);
  // Only take Advani top-tail points clear of the ONS top quintile, so the two
  // series don't collide near £100k (which caused a kink in the band).
  for (const p of t.topTailAdvani.points) {
    if (p[0] > onsMax * 1.5) pts.push([p[0], p[1] / 100]);
  }
  pts.push([bill.economicIncome, bill.pctOfEconomicIncome]);
  pts.sort((a, b) => a[0] - b[0]);
  return pts;
}
