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
