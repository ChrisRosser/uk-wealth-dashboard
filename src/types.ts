export type Geography = "GB" | "UK";
export type Unit = "household" | "adult";
export type Basis = "survey" | "adjusted";

export interface ViewValue {
  value: number;
  valueDisplay: string;
  sourceId: string;
}

export interface Figure {
  id: string;
  label: string;
  geography: Geography;
  unit: Unit;
  basis?: Basis;
  value?: number;
  valueDisplay?: string;
  sourceId?: string;
  views?: Partial<Record<Basis, ViewValue>>;
  note?: string;
}

export interface Headlines {
  meta: { generated: string; pipelineVersion: string; note?: string };
  figures: Figure[];
}

export interface Source {
  title: string;
  publisher: string;
  published?: string;
  authors?: string;
  licence?: string;
  url: string;
  caveat?: string;
}

export type Sources = Record<string, Source>;

export interface TaxData {
  meta: { generated: string; period: string; measuredSourceId: string; note: string };
  quintiles: {
    sourceId: string;
    label: string[];
    boundaryEquivalisedGbp: number[];
    representativeIncomeGbp: number[];
    allTaxesPctGross: number[];
    incomeTaxPctGross: number[];
    niPctGross: number[];
    councilPctGross: number[];
    indirectPctGross: number[];
  };
  incomeTax2025_26: {
    sourceId: string;
    personalAllowance: number;
    paTaperStart: number;
    paTaperEnd: number;
    bands: { threshold: number; rate: number }[];
    ni: {
      primaryThreshold: number;
      upperEarningsLimit: number;
      mainRate: number;
      upperRate: number;
    };
  };
  topTailAdvani: {
    sourceId: string;
    note: string;
    points: number[][];
    quarterOf3mPlusPaidAtMostPct: number;
  };
  billionaire: {
    sourceId: string;
    wealthGbp: number;
    homeEquityGbp: number;
    economicReturnPct: number;
    realisedTaxableYieldPct: number;
    realisedGainsSharePct: number;
    cgtRatePct: number;
    dividendRatePct: number;
    salaryGbp: number;
    annualSpendingGbp: number;
    vatEffectivePct: number;
    councilTaxGbp: number;
    note: string;
  };
  taxTake: {
    sourceId: string;
    currentReceiptsGbp: number;
    top01WealthShare: number;
    top01SourceId: string;
    totalHouseholdWealthGbp: number;
    note: string;
  };
  wealthTax2pct: {
    sourceId: string;
    ratePct: number;
    thresholdGbp: number;
    revenueGbp: number;
    peopleAffected: number;
    millionairesSupportPct: number;
    millionairesSourceId: string;
    votersOpposePct: number;
    pollSourceId: string;
    migrationSourceId: string;
    note: string;
  };
  payFor: {
    taxCutPerPennyGbp: number;
    taxCutSourceId: string;
    corpTaxPerPointGbp: number;
    corpTaxRatePct: number;
    vatPerPointGbp: number;
    vatRatePct: number;
    stampDutyGbp: number;
    stampDutySourceId: string;
    councilTaxGbp: number;
    councilTaxSourceId: string;
    nurseCostGbp: number;
    doctorCostGbp: number;
    teacherCostGbp: number;
    staffSourceId: string;
    nhsNurses: number;
    nhsDoctors: number;
    teacherCount: number;
    workforceSourceId: string;
    teacherSourceId: string;
    freeUniversityGbp: number;
    freeUniversitySourceId: string;
    policeOfficers: number;
    policeCostGbp: number;
    policeSourceId: string;
    socialCareGbp: number;
    socialCareSourceId: string;
    homeGrantGbp: number;
    homeSourceId: string;
    homePaybackSourceId: string;
    childPovertyGbp: number;
    childPovertyChildren: number;
    childPovertySourceId: string;
    sureStartGbp: number;
    sureStartSourceId: string;
    defenceBudgetGbp: number;
    defenceSourceId: string;
    note: string;
  };
}

export interface Distribution {
  meta: {
    generated: string;
    period: string;
    sourceId: string;
    geography: Geography;
    unit: Unit;
    totalWealthGbp: number;
  };
  thresholds: { p10: number; p50: number; p90: number; p99: number; p999: number };
  composition: { property: number; pension: number; financial: number; physical: number };
  decilesAggregateGbpMillion: number[];
  /** [cumulative population share, cumulative wealth share] pairs, 0..1 */
  lorenz: [number, number][];
  paretoTail: {
    alpha: number;
    fitFrom: string;
    impliedTop01ShareSurvey: number;
    impliedTop01ThresholdGbp: number;
    method: string;
  };
}
