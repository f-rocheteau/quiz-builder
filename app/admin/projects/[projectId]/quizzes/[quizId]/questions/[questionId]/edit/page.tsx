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

type Choice = {
  id: number;
  position: number;
  answer_text: Translation;
  is_correct: boolean;
};

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();

  const projectId =
    params.projectId as string;

  const quizId =
    params.quizId as string;

  const questionId =
    Number(
      params.questionId
    );

  const [question, setQuestion] =
    useState<Translation>({
      de: "",
      en: "",
      fr: "",
      tr: "",
    });

  const [answers, setAnswers] =
    useState<Choice[]>([]);

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

  useEffect(() => {
    async function loadQuestion() {
      /*
       * Important:
       * filter by BOTH question ID
       * and quiz ID.
       */
      const {
        data,
        error,
      } = await supabase
        .from("questions")
        .select(`
          id,
          quiz_id,
          question_text,
          time_limit,
          choices (
            id,
            position,
            answer_text,
            is_correct
          )
        `)
        .eq(
          "id",
          questionId
        )
        .eq(
          "quiz_id",
          quizId
        )
        .single();

      if (
        error ||
        !data
      ) {
        setErrorMessage(
          error?.message ??
            "Question not found."
        );

        setLoading(false);
        return;
      }

      setQuestion(
        data.question_text as Translation
      );

      setTimeLimit(
        data.time_limit
      );

      setAnswers(
        [
          ...(data.choices ??
            []),
        ].sort(
          (
            a,
            b
          ) =>
            a.position -
            b.position
        ) as Choice[]
      );

      setLoading(false);
    }

    loadQuestion();
  }, [
    questionId,
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
                  answer_text: {
                    ...answer.answer_text,
                    [language]:
                      value,
                  },
                }
              : answer
        )
    );
  }

  function setCorrectAnswer(
    answerIndex: number
  ) {
    setAnswers(
      (current) =>
        current.map(
          (
            answer,
            index
          ) => ({
            ...answer,

            is_correct:
              index ===
              answerIndex,
          })
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
     * Update question.
     */
    const {
      error: questionError,
    } = await supabase
      .from("questions")
      .update({
        question_text:
          question,

        time_limit:
          timeLimit,
      })
      .eq(
        "id",
        questionId
      )
      .eq(
        "quiz_id",
        quizId
      );

    if (questionError) {
      setErrorMessage(
        questionError.message
      );

      setSaving(false);
      return;
    }

    /*
     * Update all four choices.
     */
    for (
      const answer of answers
    ) {
      const { error } =
        await supabase
          .from("choices")
          .update({
            answer_text:
              answer.answer_text,

            is_correct:
              answer.is_correct,
          })
          .eq(
            "id",
            answer.id
          )
          .eq(
            "question_id",
            questionId
          );

      if (error) {
        setErrorMessage(
          error.message
        );

        setSaving(false);
        return;
      }
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

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Edit Question
        </h1>

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

          <TranslationFields
            value={question}
            multiline
            onChange={
              updateQuestion
            }
          />

        </section>

        {/* ANSWERS */}

        <div className="space-y-6">

          {answers.map(
            (
              answer,
              answerIndex
            ) => (

              <section
                key={answer.id}
                className="rounded-xl bg-white p-6 shadow"
              >

                <div className="mb-5 flex items-center justify-between">

                  <h2 className="text-xl font-bold text-gray-900">
                    Answer{" "}
                    {
                      answer.position
                    }
                  </h2>

                  <label className="flex items-center gap-2 font-semibold text-gray-900">

                    <input
                      type="radio"
                      name="correct"
                      checked={
                        answer.is_correct
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

                <TranslationFields
                  value={
                    answer.answer_text
                  }
                  onChange={(
                    language,
                    value
                  ) =>
                    updateAnswer(
                      answerIndex,
                      language,
                      value
                    )
                  }
                />

              </section>

            )
          )}

        </div>

        {/* TIME */}

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
              : "Save changes"}
          </button>

        </div>

      </form>

    </main>
  );
}

function TranslationFields({
  value,
  onChange,
  multiline = false,
}: {
  value: Translation;

  onChange: (
    language: Language,
    value: string
  ) => void;

  multiline?: boolean;
}) {
  const languages:
    [
      Language,
      string
    ][] = [
      ["de", "German"],
      ["en", "English"],
      ["fr", "French"],
      ["tr", "Turkish"],
    ];

  return (
    <div className="grid gap-5 md:grid-cols-2">

      {languages.map(
        ([
          language,
          label,
        ]) => (

          <div key={language}>

            <label className="mb-1 block text-sm font-semibold text-gray-900">
              {label}
            </label>

            {multiline ? (

              <textarea
                required
                rows={4}
                value={
                  value[
                    language
                  ]
                }
                onChange={(
                  event
                ) =>
                  onChange(
                    language,
                    event.target
                      .value
                  )
                }
                className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />

            ) : (

              <input
                required
                type="text"
                value={
                  value[
                    language
                  ]
                }
                onChange={(
                  event
                ) =>
                  onChange(
                    language,
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />

            )}

          </div>

        )
      )}

    </div>
  );
}