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
    economicReturnPct: number;
    realisedTaxableYieldPct: number;
    effectiveRateOnRealisedPct: number;
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
