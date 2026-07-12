import headlinesJson from "../data/headlines.json";
import sourcesJson from "../data/sources.json";
import type { Headlines, Sources } from "./types";

export const headlines = headlinesJson as Headlines;
export const sources = sourcesJson as Sources;

/** Resolve a figure's display value for the chosen basis, falling back sensibly. */
export function resolveValue(
  figure: Headlines["figures"][number],
  basis: "survey" | "adjusted"
): { valueDisplay: string; sourceId?: string } | null {
  if (figure.views) {
    const chosen = figure.views[basis] ?? figure.views.adjusted ?? figure.views.survey;
    return chosen ? { valueDisplay: chosen.valueDisplay, sourceId: chosen.sourceId } : null;
  }
  if (figure.valueDisplay) {
    return { valueDisplay: figure.valueDisplay, sourceId: figure.sourceId };
  }
  return null;
}
