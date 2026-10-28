import rawCurriculum from "@/assets/data/curriculum.json";
import { validateCurriculum } from "@/domain/validation/validateContent";

const clone = () => JSON.parse(JSON.stringify(rawCurriculum));

describe("validateCurriculum", () => {
  it("paketlenmiş müfredat geçerlidir", () => {
    const res = validateCurriculum(rawCurriculum);
    expect(res.issues).toEqual([]);
    expect(res.ok).toBe(true);
  });

  it("olmayan ön koşul dersini yakalar", () => {
    const c = clone();
    c.lessons[1].prerequisiteIds = ["yok-boyle-ders"];
    expect(validateCurriculum(c).issues.some((i) => i.message.includes("yok-boyle-ders"))).toBe(true);
  });

  it("yinelenen ders kimliğini yakalar", () => {
    const c = clone();
    c.lessons[1].id = c.lessons[0].id;
    expect(validateCurriculum(c).issues.some((i) => i.message.includes("yinelenen"))).toBe(true);
  });

  it("geçersiz seviye bağlantısını yakalar", () => {
    const c = clone();
    c.units[0].levelId = "c1";
    expect(validateCurriculum(c).ok).toBe(false);
  });

  it("ünitede listelenmeyen dersi yakalar", () => {
    const c = clone();
    c.units[0].lessonIds = c.units[0].lessonIds.slice(1);
    expect(validateCurriculum(c).issues.some((i) => i.message.includes("listelenmemiş"))).toBe(true);
  });

  it("ön koşul döngüsünü yakalar", () => {
    const c = clone();
    const [a, b] = c.lessons;
    a.prerequisiteIds = [b.id];
    b.prerequisiteIds = [a.id];
    expect(validateCurriculum(c).issues.some((i) => i.message.includes("döngü"))).toBe(true);
  });
});
