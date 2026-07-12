import { useMemo, useState } from "react";

export interface NumberField {
  raw: string;
  setRaw: (s: string) => void;
  value: number | null;
}

/** A £-amount text field: keeps the raw string, exposes a parsed positive value. */
export function useNumber(initial: number): NumberField {
  const [raw, setRaw] = useState(String(initial));
  const value = useMemo(() => {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [raw]);
  return { raw, setRaw, value };
}
