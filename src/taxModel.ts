import type { TaxData } from "./types";

export interface TaxBreakdown {
  incomeTax: number;
  nationalInsurance: number;
  capitalGainsTax: number;
  dividendTax: number;
  vatAndDuties: number;
  councilTax: number;
  total: number;
  pctOfIncome: number;
  pctOfWealth: number | null;
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

/** UK income tax (England 2025/26) with personal-allowance taper. */
export function incomeTax(gross: number, cfg: TaxData["incomeTax2025_26"]): number {
  let allowance = cfg.personalAllowance;
  if (gross > cfg.paTaperStart) {
    const taper = Math.min(allowance, (gross - cfg.paTaperStart) / 2);
    allowance -= taper;
  }
  const taxable = Math.max(0, gross - allowance);

  // Band thresholds in the JSON are stated on GROSS income; convert the basic-
  // rate band so we tax `taxable` correctly regardless of allowance taper.
  const basicTop = cfg.bands[1].threshold - cfg.personalAllowance; // 50270-12570
  const higherTop = cfg.bands[2].threshold - cfg.personalAllowance; // 125140-12570

  let tax = 0;
  tax += Math.min(taxable, basicTop) * cfg.bands[0].rate;
  if (taxable > basicTop) {
    tax += (Math.min(taxable, higherTop) - basicTop) * cfg.bands[1].rate;
  }
  if (taxable > higherTop) {
    tax += (taxable - higherTop) * cfg.bands[2].rate;
  }
  return tax;
}

/** Employee Class 1 National Insurance, 2025/26. */
export function nationalInsurance(gross: number, ni: TaxData["incomeTax2025_26"]["ni"]): number {
  if (gross <= ni.primaryThreshold) return 0;
  const main = Math.min(gross, ni.upperEarningsLimit) - ni.primaryThreshold;
  let contrib = main * ni.mainRate;
  if (gross > ni.upperEarningsLimit) {
    contrib += (gross - ni.upperEarningsLimit) * ni.upperRate;
  }
  return contrib;
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
export function taxForHousehold(income: number, wealth: number, t: TaxData): TaxBreakdown {
  const it = incomeTax(income, t.incomeTax2025_26);
  const ni = nationalInsurance(income, t.incomeTax2025_26.ni);

  const xs = t.quintiles.representativeIncomeGbp;
  const vatPct = interp(income, xs, t.quintiles.indirectPctGross) / 100;
  const councilPct = interp(income, xs, t.quintiles.councilPctGross) / 100;
  const vatAndDuties = income * vatPct;
  const councilTax = income * councilPct;

  // Ordinary households' income is overwhelmingly wages, and their wealth is
  // mostly their home and pension — neither generates taxable gains/dividends
  // year to year. We therefore treat these as zero for a typical household.
  const capitalGainsTax = 0;
  const dividendTax = 0;

  const total = it + ni + capitalGainsTax + dividendTax + vatAndDuties + councilTax;
  return {
    incomeTax: it,
    nationalInsurance: ni,
    capitalGainsTax,
    dividendTax,
    vatAndDuties,
    councilTax,
    total,
    pctOfIncome: total / income,
    pctOfWealth: wealth > 0 ? total / wealth : null,
  };
}

/**
 * The "poorest billionaire" benchmark, built bottom-up from explicit
 * assumptions so it produces the SAME line items as a normal household bill.
 */
export function billionaire(t: TaxData): BillionaireResult {
  const b = t.billionaire;
  const wealth = b.wealthGbp;
  const economicIncome = wealth * (b.economicReturnPct / 100);
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
