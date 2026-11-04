import type { Exercise } from "@/content/schema";
import { McqExercise } from "./McqExercise";
import { OrderStepsExercise } from "./OrderStepsExercise";
import { FillBlankExercise } from "./FillBlankExercise";
import { PredictOutputExercise } from "./PredictOutputExercise";
import { TraceTableExercise } from "./TraceTableExercise";
import { FlowchartBuildExercise } from "./FlowchartBuildExercise";
import { FlowchartReadExercise } from "./FlowchartReadExercise";
import { PseudoWriteExercise } from "./PseudoWriteExercise";

/**
 * Faz 3 ile birlikte tüm 8 alıştırma tipi uygulandı: mcq, order-steps,
 * fill-blank, predict-output, trace-table, flowchart-build, flowchart-read,
 * pseudo-write.
 */
export function ExerciseRouter({
  exercise,
  onResult,
}: {
  exercise: Exercise;
  onResult: (correct: boolean) => void;
}) {
  switch (exercise.type) {
    case "mcq":
      return <McqExercise exercise={exercise} onResult={onResult} />;
    case "order-steps":
      return <OrderStepsExercise exercise={exercise} onResult={onResult} />;
    case "fill-blank":
      return <FillBlankExercise exercise={exercise} onResult={onResult} />;
    case "predict-output":
      return <PredictOutputExercise exercise={exercise} onResult={onResult} />;
    case "trace-table":
      return <TraceTableExercise exercise={exercise} onResult={onResult} />;
    case "flowchart-build":
      return <FlowchartBuildExercise exercise={exercise} onResult={onResult} />;
    case "flowchart-read":
      return <FlowchartReadExercise exercise={exercise} onResult={onResult} />;
    case "pseudo-write":
      return <PseudoWriteExercise exercise={exercise} onResult={onResult} />;
  }
}
