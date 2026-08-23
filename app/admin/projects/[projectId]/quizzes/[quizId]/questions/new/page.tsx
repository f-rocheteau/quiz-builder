"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

type Language =
  | "de"
  | "en"
  | "fr"
  | "tr";

type Translation = {
  de: string;
  en: string;
  fr: string;
  tr: string;
};

type Quiz = {
  id: string;
  name: string;
};

const emptyTranslation: Translation = {
  de: "",
  en: "",
  fr: "",
  tr: "",
};

export default function NewQuestionPage() {
  const params = useParams();
  const router = useRouter();

  const projectId =
    params.projectId as string;

  const quizId =
    params.quizId as string;

  const [quiz, setQuiz] =
    useState<Quiz | null>(null);

  const [question, setQuestion] =
    useState<Translation>({
      ...emptyTranslation,
    });

  const [answers, setAnswers] =
    useState<Translation[]>([
      { ...emptyTranslation },
      { ...emptyTranslation },
      { ...emptyTranslation },
      { ...emptyTranslation },
    ]);

  const [
    correctAnswer,
    setCorrectAnswer,
  ] = useState(0);

  const [
    timeLimit,
    setTimeLimit,
  ] = useState(10);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * Check that this quiz exists
   * and belongs to this project.
   */
  useEffect(() => {
    async function loadQuiz() {
      const {
        data,
        error,
      } = await supabase
        .from("quizzes")
        .select(
          "id, name"
        )
        .eq("id", quizId)
        .eq(
          "project_id",
          projectId
        )
        .single();

      if (
        error ||
        !data
      ) {
        setErrorMessage(
          error?.message ??
            "Quiz not found."
        );

        setLoading(false);
        return;
      }

      setQuiz(
        data as Quiz
      );

      setLoading(false);
    }

    loadQuiz();
  }, [
    projectId,
    quizId,
  ]);

  function updateQuestion(
    language: Language,
    value: string
  ) {
    setQuestion(
      (current) => ({
        ...current,
        [language]: value,
      })
    );
  }

  function updateAnswer(
    answerIndex: number,
    language: Language,
    value: string
  ) {
    setAnswers(
      (current) =>
        current.map(
          (
            answer,
            index
          ) =>
            index ===
            answerIndex
              ? {
                  ...answer,
                  [language]:
                    value,
                }
              : answer
        )
    );
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    /*
     * IMPORTANT:
     * Position is calculated ONLY
     * within this quiz.
     */
    const {
      data: existingQuestions,
      error: positionError,
    } = await supabase
      .from("questions")
      .select("position")
      .eq(
        "quiz_id",
        quizId
      )
      .order(
        "position",
        {
          ascending: false,
        }
      )
      .limit(1);

    if (positionError) {
      setErrorMessage(
        positionError.message
      );

      setSaving(false);
      return;
    }

    const nextPosition =
      existingQuestions &&
      existingQuestions.length > 0
        ? existingQuestions[0]
            .position + 1
        : 1;

    /*
     * Create question.
     *
     * quiz_id is the key change
     * compared to the old system.
     */
    const {
      data: createdQuestion,
      error: questionError,
    } = await supabase
      .from("questions")
      .insert({
        quiz_id: quizId,
        position:
          nextPosition,
        question_text:
          question,
        time_limit:
          timeLimit,
      })
      .select()
      .single();

    if (
      questionError ||
      !createdQuestion
    ) {
      setErrorMessage(
        questionError?.message ??
          "Question could not be created."
      );

      setSaving(false);
      return;
    }

    /*
     * Create four answers.
     */
    const choicesToInsert =
      answers.map(
        (
          answer,
          index
        ) => ({
          question_id:
            createdQuestion.id,

          position:
            index + 1,

          answer_text:
            answer,

          is_correct:
            index ===
            correctAnswer,
        })
      );

    const {
      error: choicesError,
    } = await supabase
      .from("choices")
      .insert(
        choicesToInsert
      );

    if (choicesError) {
      /*
       * Clean up incomplete question
       * if answer creation failed.
       */
      await supabase
        .from("questions")
        .delete()
        .eq(
          "id",
          createdQuestion.id
        );

      setErrorMessage(
        "Answers could not be saved: " +
          choicesError.message
      );

      setSaving(false);
      return;
    }

    router.push(
      `/admin/projects/${projectId}/quizzes/${quizId}/questions`
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        Loading...
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="rounded-xl bg-red-100 p-5 text-red-700">
          {errorMessage ||
            "Quiz not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <form
        onSubmit={
          handleSubmit
        }
        className="mx-auto max-w-5xl"
      >

        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/projects/${projectId}/quizzes/${quizId}/questions`
            )
          }
          className="mb-5 font-semibold text-gray-600"
        >
          ← Questions
        </button>

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {quiz.name}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Add Question
          </h1>

        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* QUESTION */}

        <section className="mb-8 rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Question
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <TranslationInput
              label="German"
              value={question.de}
              multiline
              onChange={(value) =>
                updateQuestion(
                  "de",
                  value
                )
              }
            />

            <TranslationInput
              label="English"
              value={question.en}
              multiline
              onChange={(value) =>
                updateQuestion(
                  "en",
                  value
                )
              }
            />

            <TranslationInput
              label="French"
              value={question.fr}
              multiline
              onChange={(value) =>
                updateQuestion(
                  "fr",
                  value
                )
              }
            />

            <TranslationInput
              label="Turkish"
              value={question.tr}
              multiline
              onChange={(value) =>
                updateQuestion(
                  "tr",
                  value
                )
              }
            />

          </div>

        </section>

        {/* ANSWERS */}

        <div className="space-y-6">

          {answers.map(
            (
              answer,
              answerIndex
            ) => (

              <section
                key={answerIndex}
                className="rounded-xl bg-white p-6 shadow"
              >

                <div className="mb-5 flex items-center justify-between">

                  <h2 className="text-xl font-bold text-gray-900">
                    Answer{" "}
                    {answerIndex +
                      1}
                  </h2>

                  <label className="flex items-center gap-2 font-semibold text-gray-900">

                    <input
                      type="radio"
                      name="correct"
                      checked={
                        correctAnswer ===
                        answerIndex
                      }
                      onChange={() =>
                        setCorrectAnswer(
                          answerIndex
                        )
                      }
                    />

                    Correct answer

                  </label>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <TranslationInput
                    label="German"
                    value={
                      answer.de
                    }
                    onChange={(
                      value
                    ) =>
                      updateAnswer(
                        answerIndex,
                        "de",
                        value
                      )
                    }
                  />

                  <TranslationInput
                    label="English"
                    value={
                      answer.en
                    }
                    onChange={(
                      value
                    ) =>
                      updateAnswer(
                        answerIndex,
                        "en",
                        value
                      )
                    }
                  />

                  <TranslationInput
                    label="French"
                    value={
                      answer.fr
                    }
                    onChange={(
                      value
                    ) =>
                      updateAnswer(
                        answerIndex,
                        "fr",
                        value
                      )
                    }
                  />

                  <TranslationInput
                    label="Turkish"
                    value={
                      answer.tr
                    }
                    onChange={(
                      value
                    ) =>
                      updateAnswer(
                        answerIndex,
                        "tr",
                        value
                      )
                    }
                  />

                </div>

              </section>

            )
          )}

        </div>

        {/* SETTINGS */}

        <section className="mt-6 rounded-xl bg-white p-6 shadow">

          <label className="font-semibold text-gray-900">
            Time limit
          </label>

          <div className="mt-2 flex items-center gap-3">

            <input
              type="number"
              min="1"
              value={
                timeLimit
              }
              onChange={(
                event
              ) =>
                setTimeLimit(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />

            <span className="text-gray-700">
              seconds
            </span>

          </div>

        </section>

        {/* BUTTONS */}

        <div className="mt-8 flex gap-4">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/projects/${projectId}/quizzes/${quizId}/questions`
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="rounded-lg bg-black px-6 py-3 font-semibold text-white disabled:bg-gray-400"
          >
            {saving
              ? "Saving..."
              : "Save question"}
          </button>

        </div>

      </form>

    </main>
  );
}

type TranslationInputProps = {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  multiline?: boolean;
};

function TranslationInput({
  label,
  value,
  onChange,
  multiline = false,
}: TranslationInputProps) {
  return (
    <div>

      <label className="mb-1 block text-sm font-semibold text-gray-900">
        {label}
      </label>

      {multiline ? (

        <textarea
          required
          rows={4}
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
        />

      ) : (

        <input
          required
          type="text"
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
        />

      )}

    </div>
  );
}