import { normalizeAnswer } from "@/domain/question-engine/normalize";

describe("normalizeAnswer", () => {
  it("baştaki/sondaki boşlukları ve çoklu boşlukları temizler", () => {
    expect(normalizeAnswer("  She   is  happy ")).toBe("she is happy");
  });

  it("büyük/küçük harfi ve cümle sonu noktalamasını yok sayar", () => {
    expect(normalizeAnswer("She is happy.")).toBe(normalizeAnswer("she is happy"));
    expect(normalizeAnswer("Is he here?")).toBe("is he here");
  });

  it("kıvrık kesme işaretini düz kesmeye çevirir", () => {
    expect(normalizeAnswer("She doesn’t work")).toBe("she doesn't work");
  });

  it("noktalama öncesi boşluğu siler ama iç noktalamayı korur", () => {
    expect(normalizeAnswer("Yes , I am")).toBe("yes, i am");
  });

  it("kısaltmayı açık biçimle otomatik eşleştirmez", () => {
    expect(normalizeAnswer("doesn't")).not.toBe(normalizeAnswer("does not"));
  });
});
