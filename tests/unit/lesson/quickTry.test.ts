import { getLessonContent } from "@/data/contentRepository";
import { lessonFiles } from "@/data/lessonFiles";
import type { LessonContent } from "@/domain/models";
import { buildQuickTry } from "@/features/lesson/quickTry";

describe("buildQuickTry", () => {
  const ids = Object.keys(lessonFiles);

  it("üretilen her soruda 4 farklı seçenek ve tek boşluk vardır, doğru cevap seçeneklerdedir", () => {
    let built = 0;
    for (const id of ids) {
      const lesson = getLessonContent(id) as LessonContent | null;
      if (!lesson) continue;
      for (const section of lesson.sections) {
        const q = buildQuickTry(lesson, section);
        if (!q) continue;
        built++;
        expect({ id, n: new Set(q.options.map((o) => o.toLowerCase())).size }).toEqual({ id, n: 4 });
        expect(q.sentence.split("___")).toHaveLength(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.fullSentence.toLowerCase()).toContain(q.options[q.correctIndex].toLowerCase());
      }
    }
    expect(built).toBeGreaterThan(100);
  });

  it("kural dışındaki bölümler için null döner", () => {
    const lesson = getLessonContent("a1-to-be") as LessonContent;
    const intro = lesson.sections.find((s) => s.type === "intro")!;
    expect(buildQuickTry(lesson, intro)).toBeNull();
  });
});
