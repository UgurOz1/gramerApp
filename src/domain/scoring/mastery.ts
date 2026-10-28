import { MASTERY_BANDS, MASTERY_WEIGHTS, MIN_ANSWERED_FOR_MASTERY } from "@/constants/mastery";
import type { AnswerAttempt, ExamResult, MasteryBand, Question, QuestionType, TopicMastery } from "@/domain/models";

type Input = {
  lessonId: string;
  exerciseQuestions: Question[];
  examQuestions: Question[];
  attempts: AnswerAttempt[];
  examResults: ExamResult[];
};

export function bandForScore(score: number): Exclude<MasteryBand, "not_enough_data"> {
  return (MASTERY_BANDS.find((b) => score >= b.min) ?? MASTERY_BANDS[MASTERY_BANDS.length - 1]).band;
}

/** Her soru için en son cevap (doğru cevaplayınca konu iyileşir, tekrar yanlışlayınca düşer). */
function latestAttemptByQuestion(attempts: AnswerAttempt[], lessonId: string): Map<string, AnswerAttempt> {
  const latest = new Map<string, AnswerAttempt>();
  for (const a of attempts) {
    if (a.lessonId !== lessonId) continue;
    const prev = latest.get(a.questionId);
    if (!prev || a.timestamp >= prev.timestamp) latest.set(a.questionId, a);
  }
  return latest;
}

const pct = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 100);

/**
 * Konu ustalığı: alıştırma başarısı, son konu sınavı ve soru türü çeşitliliğindeki
 * başarının ağırlıklı toplamı. Ders tamamlama durumundan bağımsızdır; yalnızca
 * cevap geçmişinden hesaplanır.
 *
 * Aşırı iddiadan kaçınmak için:
 *  - yeterli sayıda farklı soru cevaplanmadıysa band "not_enough_data" olur,
 *  - konu sonu sınavı hiç çözülmediyse en yüksek band "good" ile sınırlıdır.
 */
export function computeTopicMastery(input: Input): TopicMastery {
  const latest = latestAttemptByQuestion(input.attempts, input.lessonId);
  const exerciseIds = new Set(input.exerciseQuestions.map((q) => q.id));

  // 1) Alıştırma başarısı: cevaplanan alıştırma sorularının son cevabına göre doğruluk.
  let practiceAnswered = 0;
  let practiceCorrect = 0;
  for (const [qid, a] of latest) {
    if (!exerciseIds.has(qid)) continue;
    practiceAnswered++;
    if (a.isCorrect) practiceCorrect++;
  }
  const practice = practiceAnswered ? practiceCorrect / practiceAnswered : 0;

  // 2) Son konu sonu sınavı
  const lessonExams = input.examResults.filter((r) => r.kind === "lesson" && r.lessonId === input.lessonId);
  const lastExam = lessonExams.reduce<ExamResult | null>((best, r) => (!best || r.finishedAt >= best.finishedAt ? r : best), null);
  const exam = lastExam ? lastExam.percent / 100 : 0;

  // 3) Çeşitlilik: konuda bulunan her soru türü için doğruluk ortalaması (hiç cevaplanmayan tür 0)
  const typeOf = new Map<string, QuestionType>();
  for (const q of [...input.exerciseQuestions, ...input.examQuestions]) typeOf.set(q.id, q.type);
  const perType = new Map<QuestionType, { correct: number; total: number }>();
  for (const type of new Set(typeOf.values())) perType.set(type, { correct: 0, total: 0 });
  for (const [qid, a] of latest) {
    const type = typeOf.get(qid);
    if (!type) continue;
    const entry = perType.get(type)!;
    entry.total++;
    if (a.isCorrect) entry.correct++;
  }
  const rates = [...perType.values()].map((e) => (e.total ? e.correct / e.total : 0));
  const variety = rates.length ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;

  const score = pct(
    MASTERY_WEIGHTS.practice * practice + MASTERY_WEIGHTS.exam * exam + MASTERY_WEIGHTS.variety * variety,
  );

  const answeredCount = latest.size;
  const examTaken = lastExam !== null;
  let band: MasteryBand;
  if (answeredCount < MIN_ANSWERED_FOR_MASTERY) band = "not_enough_data";
  else {
    band = bandForScore(score);
    if (band === "strong" && !examTaken) band = "good";
  }

  return {
    lessonId: input.lessonId,
    score,
    band,
    answeredCount,
    examTaken,
    components: { practice: pct(practice), exam: pct(exam), variety: pct(variety) },
  };
}
