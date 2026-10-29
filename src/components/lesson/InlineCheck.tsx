import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, icons } from "@/components/common";
import { QuestionCard } from "@/components/exercise";
import { isResponseComplete, type AnswerResponse, type Evaluation } from "@/domain/question-engine/evaluate";
import type { Question } from "@/domain/models";
import { progressService } from "@/services/progress/progressService";
import { spacing } from "@/theme";

type Props = { question: Question; sessionId: string; showHint: boolean };

/** Ders içindeki tek bir anlama kontrolü sorusu: cevapla, kontrol et, açıklamayı gör. */
export function InlineCheck({ question, sessionId, showHint }: Props) {
  const [response, setResponse] = useState<AnswerResponse | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const check = () => {
    if (!isResponseComplete(response) || evaluation) return;
    setEvaluation(progressService.submitAnswer(question, response, { sessionId, mode: "lesson_check" }));
  };

  return (
    <View style={styles.wrap}>
      <QuestionCard question={question} response={response} onChange={setResponse} evaluation={evaluation} showHint={showHint} onSubmit={check} />
      {!evaluation ? <Button title="Cevabı kontrol et" icon={icons.check} disabled={!isResponseComplete(response)} onPress={check} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing.md } });
