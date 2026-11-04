import { z } from "zod";

/**
 * İçerik doğrulama şeması — plan.md bölüm 5'teki JSON yapısına birebir uyar.
 * Yeni bir ders JSON'u bu şemayı geçmezse build kırılır (bkz. content/index.ts).
 */

const VisualSchema = z.object({
  type: z.enum(["static-svg", "animation"]),
  src: z.string().optional(),
  animation: z.null().optional(),
  // v2: animasyonlu görsellerde doldurulacak alanlar
  component: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

const HookSchema = z.object({
  text: z.string(),
  visual: VisualSchema.optional(),
});

const ConceptBlockSchema = z.object({
  heading: z.string(),
  body: z.string(),
  visual: VisualSchema.optional(),
});

const WorkedExampleStepSchema = z.object({
  line: z.number().int().nonnegative(),
  explain: z.string(),
  vars: z.record(z.string(), z.unknown()).optional(),
  output: z.array(z.string()).optional(),
});

const WorkedExampleSchema = z.object({
  prompt: z.string(),
  pseudocode: z.array(z.string()),
  steps: z.array(WorkedExampleStepSchema),
  // Verilirse LessonPlayer, elle yazılmış `steps` açıklamalarının yanında
  // gerçekten ÇALIŞTIRILABİLİR bir Step Runner gösterir (bkz. components/runner).
  // Sözde kod burada "OKU"lar için `runnerInputs` sırasıyla kullanılır.
  runnerSource: z.string().optional(),
  runnerInputs: z.array(z.union([z.number(), z.string(), z.boolean()])).optional(),
});

const ExerciseFeedbackSchema = z.object({
  correct: z.string(),
  incorrect: z.string(),
});

const BaseExerciseSchema = z.object({
  id: z.string(),
  difficulty: z.number().int().min(1).max(3),
  hint: z.string().optional(),
});

const McqExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("mcq"),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().nonnegative(),
  feedback: ExerciseFeedbackSchema,
});

const OrderStepsExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("order-steps"),
  question: z.string(),
  steps: z.array(z.string()).min(2),
  correctOrder: z.array(z.number().int()),
});

const FillBlankExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("fill-blank"),
  question: z.string(),
  template: z.string(), // "___" boşluğu temsil eder
  options: z.array(z.string()).optional(), // verilirse seçmeli, yoksa serbest yazım
  answer: z.string(),
});

const TraceTableExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("trace-table"),
  pseudocode: z.array(z.string()),
  columns: z.array(z.string()),
  expectedRows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
});

const PredictOutputExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("predict-output"),
  pseudocode: z.array(z.string()),
  question: z.string(),
  correctOutput: z.array(z.string()),
});

const FlowchartNodeSchema = z.object({
  id: z.string(),
  shape: z.enum(["terminal", "process", "decision", "io"]),
  label: z.string(),
});
const FlowchartEdgeSchema = z.object({ from: z.string(), to: z.string(), label: z.string().optional() });

const FlowchartBuildExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("flowchart-build"),
  question: z.string(),
  expectedNodes: z.array(FlowchartNodeSchema),
  expectedEdges: z.array(FlowchartEdgeSchema),
});

const FlowchartReadExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("flowchart-read"),
  // v1'de gerçek görsel varlık (asset) üretme hattı yok; şema doğrudan
  // nodes/edges ile çizilir. `imageSrc` v2'de gerçek görseller eklendiğinde
  // kullanılacak (o zaman nodes/edges alanı opsiyonel kalmaya devam eder).
  imageSrc: z.string().optional(),
  nodes: z.array(FlowchartNodeSchema).optional(),
  edges: z.array(FlowchartEdgeSchema).optional(),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().nonnegative(),
});

const PseudoWriteExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("pseudo-write"),
  question: z.string(),
  requiredKeywords: z.array(z.string()),
  sampleSolution: z.string(),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  McqExerciseSchema,
  OrderStepsExerciseSchema,
  FillBlankExerciseSchema,
  TraceTableExerciseSchema,
  PredictOutputExerciseSchema,
  FlowchartBuildExerciseSchema,
  FlowchartReadExerciseSchema,
  PseudoWriteExerciseSchema,
]);

export const LessonSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  title: z.string(),
  estimatedMinutes: z.number().positive(),
  prerequisites: z.array(z.string()),
  objectives: z.array(z.string()),
  hook: HookSchema,
  concept: z.array(ConceptBlockSchema),
  workedExamples: z.array(WorkedExampleSchema),
  exercises: z.array(ExerciseSchema).min(1),
  summary: z.array(z.string()),
});

export type Lesson = z.infer<typeof LessonSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type McqExercise = z.infer<typeof McqExerciseSchema>;
export type OrderStepsExercise = z.infer<typeof OrderStepsExerciseSchema>;
export type FillBlankExercise = z.infer<typeof FillBlankExerciseSchema>;
export type TraceTableExercise = z.infer<typeof TraceTableExerciseSchema>;
export type PredictOutputExercise = z.infer<typeof PredictOutputExerciseSchema>;
export type FlowchartBuildExercise = z.infer<typeof FlowchartBuildExerciseSchema>;
export type FlowchartReadExercise = z.infer<typeof FlowchartReadExerciseSchema>;
export type PseudoWriteExercise = z.infer<typeof PseudoWriteExerciseSchema>;
