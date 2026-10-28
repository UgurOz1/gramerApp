import { getAvailableLessonIds, getContentIssues, getCurriculum } from "@/data/contentRepository";
import { lessonFiles } from "@/data/lessonFiles";
import { formatIssues } from "@/domain/validation/validateContent";

/** Uygulamaya paketlenen tüm içeriğin doğrulanması. İçerik eklerken bu test çalıştırılmalı. */
describe("paketlenmiş içerik", () => {
  it("doğrulama sorunu içermez", () => {
    const issues = getContentIssues();
    if (issues.length > 0) throw new Error(formatIssues(issues));
  });

  it("müfredat yüklenir", () => {
    expect(getCurriculum()?.lessons.length).toBeGreaterThan(0);
  });

  it("kayıtlı her ders dosyası kullanılabilir durumdadır", () => {
    expect(getAvailableLessonIds().sort()).toEqual(Object.keys(lessonFiles).sort());
  });
});
