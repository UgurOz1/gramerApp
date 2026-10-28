import type {
  Comparison,
  Curriculum,
  LessonContent,
  LevelId,
} from "@/domain/models";

import { IssueCollector, type ValidationIssue, type ValidationResult } from "./result";
import { validateQuestion } from "./validateQuestion";

export const SUPPORTED_SCHEMA_VERSION = 1;
const LEVEL_IDS: LevelId[] = ["a1", "a2", "b1", "b2"];
const SECTION_TYPES = ["intro", "rule", "forms", "examples", "usage", "mistakes", "confusions", "notes", "check"];

export function validateCurriculum(raw: unknown): ValidationResult<Curriculum> {
  const c = new IssueCollector();
  if (!c.isObject(raw, "curriculum")) return c.result(raw);
  if (raw.schemaVersion !== SUPPORTED_SCHEMA_VERSION) c.add("curriculum.schemaVersion", "desteklenmeyen sürüm");
  c.number(raw, "contentVersion", "curriculum");

  const levelIds = new Set<string>();
  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();
  const levels = c.array(raw, "levels", "curriculum", { nonEmpty: true });
  const units = c.array(raw, "units", "curriculum", { nonEmpty: true });
  const lessons = c.array(raw, "lessons", "curriculum", { nonEmpty: true });

  const unique = (set: Set<string>, id: unknown, path: string) => {
    if (typeof id !== "string") return;
    if (set.has(id)) c.add(path, `yinelenen kimlik: ${id}`);
    set.add(id);
  };

  levels.forEach((l, i) => {
    const p = `levels[${i}]`;
    if (!c.isObject(l, p)) return;
    c.oneOf(l, "id", LEVEL_IDS, p);
    ["code", "title", "description"].forEach((k) => c.string(l, k, p));
    c.number(l, "order", p);
    c.stringArray(l, "unitIds", p, { nonEmpty: true });
    unique(levelIds, l.id, p);
  });
  units.forEach((u, i) => {
    const p = `units[${i}]`;
    if (!c.isObject(u, p)) return;
    c.string(u, "id", p);
    c.string(u, "title", p);
    c.number(u, "order", p);
    c.stringArray(u, "lessonIds", p, { nonEmpty: true });
    unique(unitIds, u.id, p);
    if (!levelIds.has(String(u.levelId))) c.add(`${p}.levelId`, `olmayan seviye: ${String(u.levelId)}`);
  });
  lessons.forEach((l, i) => {
    const p = `lessons[${i}]`;
    if (!c.isObject(l, p)) return;
    ["id", "title", "summary"].forEach((k) => c.string(l, k, p));
    c.oneOf(l, "kind", ["lesson", "comparison"], p);
    c.number(l, "order", p);
    c.number(l, "estimatedMinutes", p);
    c.stringArray(l, "prerequisiteIds", p);
    unique(lessonIds, l.id, p);
    if (!levelIds.has(String(l.levelId))) c.add(`${p}.levelId`, `olmayan seviye: ${String(l.levelId)}`);
    if (!unitIds.has(String(l.unitId))) c.add(`${p}.unitId`, `olmayan ünite: ${String(l.unitId)}`);
  });

  // Çapraz referanslar
  const unitLevel = new Map<string, unknown>();
  units.forEach((u) => c.isObject(u, "_") && unitLevel.set(String(u.id), u.levelId));
  const lessonUnit = new Map<string, unknown>();
  lessons.forEach((l) => c.isObject(l, "_") && lessonUnit.set(String(l.id), l.unitId));

  levels.forEach((l, i) => {
    if (typeof l !== "object" || l === null || !Array.isArray((l as { unitIds?: unknown }).unitIds)) return;
    const lv = l as { id: string; unitIds: string[] };
    lv.unitIds.forEach((uid, j) => {
      if (!unitIds.has(uid)) c.add(`levels[${i}].unitIds[${j}]`, `olmayan ünite: ${uid}`);
      else if (unitLevel.get(uid) !== lv.id) c.add(`levels[${i}].unitIds[${j}]`, `ünite başka seviyeye ait: ${uid}`);
    });
  });
  const listedLessons = new Set<string>();
  units.forEach((u, i) => {
    if (typeof u !== "object" || u === null || !Array.isArray((u as { lessonIds?: unknown }).lessonIds)) return;
    const un = u as { id: string; lessonIds: string[] };
    un.lessonIds.forEach((lid, j) => {
      listedLessons.add(lid);
      if (!lessonIds.has(lid)) c.add(`units[${i}].lessonIds[${j}]`, `olmayan ders: ${lid}`);
      else if (lessonUnit.get(lid) !== un.id) c.add(`units[${i}].lessonIds[${j}]`, `ders başka üniteye ait: ${lid}`);
    });
  });
  lessons.forEach((l, i) => {
    if (typeof l !== "object" || l === null) return;
    const ls = l as { id: string; prerequisiteIds?: unknown };
    if (!listedLessons.has(ls.id)) c.add(`lessons[${i}]`, `hiçbir ünitede listelenmemiş: ${ls.id}`);
    if (Array.isArray(ls.prerequisiteIds)) {
      ls.prerequisiteIds.forEach((pid, j) => {
        if (pid === ls.id) c.add(`lessons[${i}].prerequisiteIds[${j}]`, "ders kendisine ön koşul olamaz");
        else if (!lessonIds.has(String(pid))) c.add(`lessons[${i}].prerequisiteIds[${j}]`, `olmayan ders: ${String(pid)}`);
      });
    }
  });
  if (c.issues.length === 0) detectPrerequisiteCycles(raw as unknown as Curriculum, c);

  return c.result(raw);
}

function detectPrerequisiteCycles(curriculum: Curriculum, c: IssueCollector) {
  const prereqs = new Map(curriculum.lessons.map((l) => [l.id, l.prerequisiteIds]));
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string, trail: string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      c.add("lessons", `ön koşul döngüsü: ${[...trail, id].join(" → ")}`);
      return;
    }
    state.set(id, "visiting");
    for (const p of prereqs.get(id) ?? []) visit(p, [...trail, id]);
    state.set(id, "done");
  };
  for (const id of prereqs.keys()) visit(id, []);
}

/**
 * Tek bir ders dosyasını denetler. `curriculum` verilirse dersin katalogdaki
 * kaydıyla uyumu ve diğer derslere verilen bağlantılar da kontrol edilir.
 */
export function validateLessonContent(raw: unknown, curriculum?: Curriculum): ValidationResult<LessonContent> {
  const c = new IssueCollector();
  if (!c.isObject(raw, "lesson")) return c.result(raw);
  const path = typeof raw.id === "string" ? raw.id : "lesson";

  if (raw.schemaVersion !== SUPPORTED_SCHEMA_VERSION) c.add(`${path}.schemaVersion`, "desteklenmeyen sürüm");
  c.string(raw, "id", path);
  c.string(raw, "title", path);
  c.oneOf(raw, "levelId", LEVEL_IDS, path);
  c.stringArray(raw, "objectives", path, { nonEmpty: true });

  const lessonId = String(raw.id);
  const levelId = raw.levelId as LevelId;
  if (curriculum) {
    const summary = curriculum.lessons.find((l) => l.id === lessonId);
    if (!summary) c.add(`${path}.id`, "müfredatta bulunmuyor");
    else if (summary.levelId !== levelId) c.add(`${path}.levelId`, `müfredatta ${summary.levelId}`);
  }

  // Örnekler
  const exampleIds = new Set<string>();
  c.array(raw, "examples", path, { nonEmpty: true }).forEach((e, i) => {
    const p = `${path}.examples[${i}]`;
    if (!c.isObject(e, p)) return;
    ["id", "en", "tr"].forEach((k) => c.string(e, k, p));
    c.string(e, "note", p, { optional: true });
    c.string(e, "highlight", p, { optional: true });
    if (typeof e.highlight === "string" && typeof e.en === "string" && !e.en.includes(e.highlight)) {
      c.add(`${p}.highlight`, "İngilizce cümlenin içinde geçmeli");
    }
    if (typeof e.id === "string") {
      if (exampleIds.has(e.id)) c.add(p, `yinelenen örnek kimliği: ${e.id}`);
      exampleIds.add(e.id);
    }
  });

  // Sorular (alıştırma + sınav) — kimlikler ders içinde benzersiz olmalı
  const questionIds = new Set<string>();
  const addQuestion = (q: unknown, p: string) => {
    const id = validateQuestion(q, p, c, { lessonId, levelId });
    if (!id) return;
    if (questionIds.has(id)) c.add(p, `yinelenen soru kimliği: ${id}`);
    questionIds.add(id);
  };
  const exerciseIds = new Set<string>();
  c.array(raw, "exercises", path, { nonEmpty: true }).forEach((q, i) => {
    addQuestion(q, `${path}.exercises[${i}]`);
    if (typeof q === "object" && q !== null && typeof (q as { id?: unknown }).id === "string") {
      exerciseIds.add((q as { id: string }).id);
    }
  });
  if (c.isObject(raw.exam, `${path}.exam`)) {
    const exam = raw.exam;
    const p = `${path}.exam`;
    ["id", "title", "description"].forEach((k) => c.string(exam, k, p));
    c.number(exam, "passPercent", p);
    c.array(exam, "questions", p, { nonEmpty: true }).forEach((q, i) => addQuestion(q, `${p}.questions[${i}]`));
  }

  // Bölümler ve iç bağlantılar
  const sectionIds = new Set<string>();
  const checkExampleRefs = (ids: unknown, p: string) => {
    if (!Array.isArray(ids)) return;
    ids.forEach((id, j) => {
      if (!exampleIds.has(String(id))) c.add(`${p}[${j}]`, `olmayan örnek: ${String(id)}`);
    });
  };
  c.array(raw, "sections", path, { nonEmpty: true }).forEach((s, i) => {
    const p = `${path}.sections[${i}]`;
    if (!c.isObject(s, p)) return;
    c.string(s, "id", p);
    c.string(s, "title", p);
    c.oneOf(s, "type", SECTION_TYPES, p);
    if (typeof s.id === "string") {
      if (sectionIds.has(s.id)) c.add(p, `yinelenen bölüm kimliği: ${s.id}`);
      sectionIds.add(s.id);
    }
    switch (s.type) {
      case "intro":
        c.stringArray(s, "paragraphs", p, { nonEmpty: true });
        break;
      case "rule":
        c.stringArray(s, "paragraphs", p, { nonEmpty: true });
        c.array(s, "formulas", p, { optional: true }).forEach((f, j) => {
          const fp = `${p}.formulas[${j}]`;
          if (!c.isObject(f, fp)) return;
          c.string(f, "label", fp);
          c.string(f, "pattern", fp);
          checkExampleRefs(f.exampleIds, `${fp}.exampleIds`);
        });
        break;
      case "forms":
        c.stringArray(s, "paragraphs", p, { optional: true });
        c.array(s, "forms", p, { nonEmpty: true }).forEach((f, j) => {
          const fp = `${p}.forms[${j}]`;
          if (!c.isObject(f, fp)) return;
          c.string(f, "label", fp);
          c.string(f, "formula", fp);
          c.string(f, "note", fp, { optional: true });
          c.stringArray(f, "exampleIds", fp, { nonEmpty: true });
          checkExampleRefs(f.exampleIds, `${fp}.exampleIds`);
        });
        break;
      case "examples":
        c.stringArray(s, "paragraphs", p, { optional: true });
        c.stringArray(s, "exampleIds", p, { nonEmpty: true });
        checkExampleRefs(s.exampleIds, `${p}.exampleIds`);
        break;
      case "usage":
        c.stringArray(s, "paragraphs", p, { optional: true });
        c.array(s, "items", p, { nonEmpty: true }).forEach((it, j) => {
          const ip = `${p}.items[${j}]`;
          if (!c.isObject(it, ip)) return;
          c.string(it, "heading", ip);
          c.string(it, "body", ip);
          checkExampleRefs(it.exampleIds, `${ip}.exampleIds`);
        });
        break;
      case "mistakes":
        c.array(s, "items", p, { nonEmpty: true }).forEach((it, j) => {
          const ip = `${p}.items[${j}]`;
          if (!c.isObject(it, ip)) return;
          ["wrong", "right", "explanation"].forEach((k) => c.string(it, k, ip));
        });
        break;
      case "confusions":
        c.array(s, "items", p, { nonEmpty: true }).forEach((it, j) => {
          const ip = `${p}.items[${j}]`;
          if (!c.isObject(it, ip)) return;
          c.string(it, "topic", ip);
          c.string(it, "body", ip);
          c.string(it, "lessonId", ip, { optional: true });
          c.string(it, "comparisonId", ip, { optional: true });
          if (curriculum && typeof it.lessonId === "string" && !curriculum.lessons.some((l) => l.id === it.lessonId)) {
            c.add(`${ip}.lessonId`, `olmayan ders: ${it.lessonId}`);
          }
        });
        break;
      case "notes":
        c.oneOf(s, "tone", ["info", "warning"], p);
        c.stringArray(s, "items", p, { nonEmpty: true });
        break;
      case "check":
        c.stringArray(s, "questionIds", p, { nonEmpty: true }).forEach((qid, j) => {
          if (!exerciseIds.has(qid)) c.add(`${p}.questionIds[${j}]`, `alıştırmalarda olmayan soru: ${qid}`);
        });
        break;
    }
  });

  return c.result(raw);
}

export function validateComparison(raw: unknown, curriculum?: Curriculum): ValidationResult<Comparison> {
  const c = new IssueCollector();
  if (!c.isObject(raw, "comparison")) return c.result(raw);
  const path = typeof raw.id === "string" ? raw.id : "comparison";

  if (raw.schemaVersion !== SUPPORTED_SCHEMA_VERSION) c.add(`${path}.schemaVersion`, "desteklenmeyen sürüm");
  c.string(raw, "id", path);
  c.string(raw, "title", path);
  c.oneOf(raw, "levelId", LEVEL_IDS, path);
  c.stringArray(raw, "objectives", path, { nonEmpty: true });
  c.stringArray(raw, "intro", path, { nonEmpty: true });

  const id = String(raw.id);
  const levelId = raw.levelId as LevelId;
  const lessonIds = c.stringArray(raw, "lessonIds", path, { nonEmpty: true });
  if (curriculum) {
    const summary = curriculum.lessons.find((l) => l.id === id);
    if (!summary) c.add(`${path}.id`, "müfredatta bulunmuyor");
    else {
      if (summary.kind !== "comparison") c.add(`${path}.id`, "müfredatta bir karşılaştırma dersi olmalı (kind: comparison)");
      if (summary.levelId !== levelId) c.add(`${path}.levelId`, `müfredatta ${summary.levelId}`);
    }
    lessonIds.forEach((lid, j) => {
      if (!curriculum.lessons.some((l) => l.id === lid)) c.add(`${path}.lessonIds[${j}]`, `olmayan ders: ${lid}`);
    });
  }

  const structures = c.array(raw, "structures", path, { nonEmpty: true });
  if (structures.length < 2) c.add(`${path}.structures`, "karşılaştırma için en az 2 yapı gerekli");
  structures.forEach((st, j) => {
    const sp = `${path}.structures[${j}]`;
    if (!c.isObject(st, sp)) return;
    c.string(st, "name", sp);
    c.string(st, "meaning", sp);
    c.stringArray(st, "usage", sp, { nonEmpty: true });
    c.stringArray(st, "signals", sp, { nonEmpty: true });
    c.array(st, "forms", sp, { nonEmpty: true }).forEach((f, k) => {
      const fp = `${sp}.forms[${k}]`;
      if (!c.isObject(f, fp)) return;
      ["label", "pattern", "example"].forEach((key) => c.string(f, key, fp));
    });
  });

  const exampleIds = new Set<string>();
  c.array(raw, "pairs", path, { nonEmpty: true }).forEach((pair, j) => {
    const pp = `${path}.pairs[${j}]`;
    if (!c.isObject(pair, pp)) return;
    c.string(pair, "note", pp);
    for (const side of ["left", "right"] as const) {
      const sp = `${pp}.${side}`;
      if (!c.isObject(pair[side], sp)) continue;
      const ex = pair[side] as Record<string, unknown>;
      ["id", "en", "tr"].forEach((key) => c.string(ex, key, sp));
      c.string(ex, "highlight", sp, { optional: true });
      if (typeof ex.highlight === "string" && typeof ex.en === "string" && !ex.en.includes(ex.highlight)) {
        c.add(`${sp}.highlight`, "İngilizce cümlenin içinde geçmeli");
      }
      if (typeof ex.id === "string") {
        if (exampleIds.has(ex.id)) c.add(sp, `yinelenen örnek kimliği: ${ex.id}`);
        exampleIds.add(ex.id);
      }
    }
  });

  c.array(raw, "meaningDifference", path, { nonEmpty: true }).forEach((it, j) => {
    const ip = `${path}.meaningDifference[${j}]`;
    if (!c.isObject(it, ip)) return;
    ["heading", "body"].forEach((key) => c.string(it, key, ip));
  });
  c.array(raw, "decisionGuide", path, { nonEmpty: true }).forEach((it, j) => {
    const ip = `${path}.decisionGuide[${j}]`;
    if (!c.isObject(it, ip)) return;
    ["question", "answer"].forEach((key) => c.string(it, key, ip));
  });
  c.array(raw, "confusions", path, { nonEmpty: true }).forEach((it, j) => {
    const ip = `${path}.confusions[${j}]`;
    if (!c.isObject(it, ip)) return;
    ["wrong", "right", "explanation"].forEach((key) => c.string(it, key, ip));
  });

  // Mini test soruları karşılaştırmanın kimliğine bağlıdır.
  const quizIds = new Set<string>();
  c.array(raw, "quiz", path, { nonEmpty: true }).forEach((q, j) => {
    const qid = validateQuestion(q, `${path}.quiz[${j}]`, c, { lessonId: id, levelId });
    if (qid) {
      if (quizIds.has(qid)) c.add(`${path}.quiz[${j}]`, `yinelenen soru kimliği: ${qid}`);
      quizIds.add(qid);
    }
  });

  return c.result(raw);
}

/** Tüm içerik genelinde soru kimliklerinin benzersizliğini denetler. */
export function findDuplicateQuestionIds(lessons: LessonContent[], comparisons: Comparison[]): ValidationIssue[] {
  const owner = new Map<string, string>();
  const issues: ValidationIssue[] = [];
  const register = (id: string, where: string) => {
    const prev = owner.get(id);
    if (prev) issues.push({ path: where, message: `soru kimliği ${prev} içinde de kullanılıyor: ${id}` });
    else owner.set(id, where);
  };
  for (const l of lessons) {
    for (const q of [...l.exercises, ...l.exam.questions]) register(q.id, l.id);
  }
  for (const cmp of comparisons) {
    for (const q of cmp.quiz) register(q.id, cmp.id);
  }
  return issues;
}

export function formatIssues(issues: ValidationIssue[]): string {
  return issues.map((i) => `• ${i.path}: ${i.message}`).join("\n");
}
