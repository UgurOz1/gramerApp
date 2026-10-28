import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { QuestionCard } from "@/components/exercise";
import { getLessonContent } from "@/data/contentRepository";
import type { Question } from "@/domain/models";
import { evaluateAnswer, type AnswerResponse, type Evaluation } from "@/domain/question-engine/evaluate";

const lesson = getLessonContent("a1-to-be")!;
const byType = (t: Question["type"]) => lesson.exercises.find((q) => q.type === t)!;

/** Ekranların yaptığı gibi cevabı tutan ve kontrol eden minimal kap. */
function Harness({ question, onResponse }: { question: Question; onResponse?: (r: AnswerResponse | null) => void }) {
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  return (
    <>
      <QuestionCard
        question={question}
        response={response}
        onChange={(r) => {
          setResponse(r);
          onResponse?.(r);
        }}
        evaluation={evaluation}
      />
      <Pressable
        onPress={() => response && setEvaluation(evaluateAnswer(question, response))}
        accessibilityRole="button"
        accessibilityLabel="kontrol"
      >
        <Text>kontrol</Text>
      </Pressable>
    </>
  );
}

describe("QuestionCard", () => {
  it("çoktan seçmeli: seçenek seçilir, kontrol sonrası doğru cevap ve açıklamalar görünür", async () => {
    const q = byType("multiple_choice");
    if (q.type !== "multiple_choice") throw new Error();
    const wrong = q.options.find((o) => o.id !== q.correctOptionId)!;
    await render(<Harness question={q} />);

    await fireEvent.press(screen.getByRole("radio", { name: wrong.text }));
    await fireEvent.press(screen.getByRole("button", { name: "kontrol" }));

    // Yanlış durumu yalnızca renkle değil metinle de belirtilir (seçenekte ve geri bildirim panelinde).
    expect(screen.getAllByText("Yanlış").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Doğru")).toBeTruthy();
    expect(screen.getByText("DOĞRU CEVAP")).toBeTruthy();
    expect(screen.getByText(q.explanation)).toBeTruthy();
    expect(screen.getByText("DİĞER SEÇENEKLER NEDEN YANLIŞ?")).toBeTruthy();
  });

  it("cümle kurma: parçalar eklenir, geri alınır ve yinelenen kelimeler desteklenir", async () => {
    const q = lesson.exercises.find((x) => x.type === "sentence_building" && new Set(x.answer).size < x.answer.length)!;
    if (q.type !== "sentence_building") throw new Error();
    const responses: (AnswerResponse | null)[] = [];
    await render(<Harness question={q} onResponse={(r) => responses.push(r)} />);

    // Doğru sırayla her parçaya dokun; aynı metne sahip parçalar ayrı ayrı kullanılabilmeli.
    for (const token of q.answer) {
      const candidates = screen.getAllByRole("button", { name: `${token}. Eklemek için dokun` });
      await fireEvent.press(candidates[0]);
    }
    const last = responses[responses.length - 1];
    expect(last).toEqual({ type: "sentence_building", tokens: q.answer });
    expect(evaluateAnswer(q, last!).isCorrect).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Geri al" }));
    const afterUndo = responses[responses.length - 1];
    expect(afterUndo).toEqual({ type: "sentence_building", tokens: q.answer.slice(0, -1) });

    await fireEvent.press(screen.getByRole("button", { name: "Temizle" }));
    expect(responses[responses.length - 1]).toBeNull();
  });

  it("cümle kurma: Türkçe karşılık ipucu kapalıyken bile soru olarak görünür", async () => {
    const q = byType("sentence_building");
    await render(<QuestionCard question={q} response={null} onChange={() => {}} evaluation={null} showHint={false} />);
    expect(screen.getByText(q.hint!)).toBeTruthy();
  });

  it("boşluk doldurma: yazılan metin cevap olur, boşken cevap null olur", async () => {
    const q = byType("fill_blank");
    const responses: (AnswerResponse | null)[] = [];
    await render(<Harness question={q} onResponse={(r) => responses.push(r)} />);

    const input = screen.getByLabelText("Cevabın");
    await fireEvent.changeText(input, "  am ");
    expect(responses.at(-1)).toEqual({ type: "fill_blank", text: "  am " });
    await fireEvent.changeText(input, "   ");
    expect(responses.at(-1)).toBeNull();
  });

  it("hata düzeltme: hatalı cümle hazır gelir; değiştirilmeden cevap sayılmaz", async () => {
    const q = byType("error_correction");
    if (q.type !== "error_correction") throw new Error();
    const responses: (AnswerResponse | null)[] = [];
    await render(<Harness question={q} onResponse={(r) => responses.push(r)} />);

    const input = screen.getByLabelText("Düzelttiğin cümle");
    expect(input.props.value).toBe(q.incorrectSentence);
    await fireEvent.changeText(input, q.incorrectSentence);
    expect(responses.at(-1)).toBeNull();
    await fireEvent.changeText(input, q.answers[0]);
    expect(responses.at(-1)).toEqual({ type: "error_correction", text: q.answers[0] });
  });
});
