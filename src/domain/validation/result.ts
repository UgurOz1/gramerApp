export type ValidationIssue = { path: string; message: string };

export type ValidationResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: ValidationIssue[] };

/** Doğrulama sırasında sorunları biriktiren yardımcı. */
export class IssueCollector {
  readonly issues: ValidationIssue[] = [];

  add(path: string, message: string) {
    this.issues.push({ path, message });
  }

  isObject(value: unknown, path: string): value is Record<string, unknown> {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) return true;
    this.add(path, "nesne olmalı");
    return false;
  }

  string(obj: Record<string, unknown>, key: string, path: string, opts: { optional?: boolean } = {}) {
    const v = obj[key];
    if (v === undefined && opts.optional) return;
    if (typeof v !== "string" || v.trim() === "") this.add(`${path}.${key}`, "boş olmayan metin olmalı");
  }

  number(obj: Record<string, unknown>, key: string, path: string) {
    if (typeof obj[key] !== "number" || !Number.isFinite(obj[key])) this.add(`${path}.${key}`, "sayı olmalı");
  }

  oneOf(obj: Record<string, unknown>, key: string, allowed: readonly unknown[], path: string) {
    if (!allowed.includes(obj[key])) {
      this.add(`${path}.${key}`, `şunlardan biri olmalı: ${allowed.join(", ")}`);
    }
  }

  /** Dizi alanını döndürür; dizi değilse sorun ekler ve boş dizi döner. */
  array(obj: Record<string, unknown>, key: string, path: string, opts: { optional?: boolean; nonEmpty?: boolean } = {}): unknown[] {
    const v = obj[key];
    if (v === undefined && opts.optional) return [];
    if (!Array.isArray(v)) {
      this.add(`${path}.${key}`, "dizi olmalı");
      return [];
    }
    if (opts.nonEmpty && v.length === 0) this.add(`${path}.${key}`, "boş olmamalı");
    return v;
  }

  stringArray(obj: Record<string, unknown>, key: string, path: string, opts: { optional?: boolean; nonEmpty?: boolean } = {}): string[] {
    const arr = this.array(obj, key, path, opts);
    arr.forEach((item, i) => {
      if (typeof item !== "string" || item.trim() === "") this.add(`${path}.${key}[${i}]`, "boş olmayan metin olmalı");
    });
    return arr.filter((x): x is string => typeof x === "string");
  }

  result<T>(value: unknown): ValidationResult<T> {
    return this.issues.length === 0
      ? { ok: true, value: value as T, issues: [] }
      : { ok: false, issues: this.issues };
  }
}
