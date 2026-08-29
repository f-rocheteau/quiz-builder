"use client";

import {
  useCallback,
  useEffect,
  useRef,
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
  de?: string;
  en?: string;
  fr?: string;
  tr?: string;
};

type Choice = {
  id: number;
  position: number;
  answer_text: Translation;
};

type PublicQuiz = {
  project_id: string;
  project_name: string;
  project_slug: string;

  quiz_id: string;
  quiz_name: string;
  quiz_slug: string;

  quiz_cover_image_url: string | null;
};

type QuestionData = {
  question_id: number;
  question_position: number;
  question_text: Translation;
  time_limit: number;
  started_at: string;
  server_now: string;
  answer_choices: Choice[];
};

type AnswerResult = {
  accepted: boolean;
  correct: boolean;
  awarded_points: number;
  elapsed_ms: number;
};

function translate(
  value: Translation,
  language: Language
) {
  return (
    value[language] ??
    value.en ??
    value.de ??
    value.fr ??
    value.tr ??
    ""
  );
}

const translations = {
  de: {
    question: "Frage",
    correct: "Richtig!",
    wrong: "Leider falsch",
    timeUp: "Zeit abgelaufen",
    points: "Punkte",
    loading: "Quiz wird geladen...",
    finished: "Quiz beendet!",
    finishedText:
      "Du hast alle Fragen beantwortet.",
    error: "Ein Fehler ist aufgetreten.",
  },

  en: {
    question: "Question",
    correct: "Correct!",
    wrong: "Wrong answer",
    timeUp: "Time's up",
    points: "points",
    loading: "Loading quiz...",
    finished: "Quiz complete!",
    finishedText:
      "You answered all questions.",
    error: "Something went wrong.",
  },

  fr: {
    question: "Question",
    correct: "Correct !",
    wrong: "Mauvaise réponse",
    timeUp: "Temps écoulé",
    points: "points",
    loading: "Chargement du quiz...",
    finished: "Quiz terminé !",
    finishedText:
      "Vous avez répondu à toutes les questions.",
    error: "Une erreur est survenue.",
  },

  tr: {
    question: "Soru",
    correct: "Doğru!",
    wrong: "Yanlış cevap",
    timeUp: "Süre doldu",
    points: "puan",
    loading: "Yarışma yükleniyor...",
    finished: "Yarışma tamamlandı!",
    finishedText:
      "Tüm soruları cevapladınız.",
    error: "Bir hata oluştu.",
  },
};

export default function QuizPage() {
  const params =
    useParams<{
      projectSlug: string;
      quizSlug: string;
    }>();

  const router =
    useRouter();

  const projectSlug =
    params.projectSlug;

  const quizSlug =
    params.quizSlug;

  const [
    quiz,
    setQuiz,
  ] =
    useState<PublicQuiz | null>(
      null
    );

  const [
    language,
    setLanguage,
  ] =
    useState<Language>("en");

  const [
    question,
    setQuestion,
  ] =
    useState<QuestionData | null>(
      null
    );

  const [
    remainingMs,
    setRemainingMs,
  ] =
    useState(0);

  const [
    deadline,
    setDeadline,
  ] =
    useState<number | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    locked,
    setLocked,
  ] =
    useState(false);

  const [
    result,
    setResult,
  ] =
    useState<AnswerResult | null>(
      null
    );

  const [
    timedOut,
    setTimedOut,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const playerIdRef =
    useRef<string | null>(
      null
    );

  const quizIdRef =
    useRef<string | null>(
      null
    );

  const movingToNext =
    useRef(false);

  const nextQuestionTimeoutRef =
    useRef<number | null>(
      null
    );


  /*
   * Start or resume next question.
   */
const loadQuestion =
  useCallback(
    async (
      playerId: string,
      quizId: string
    ) => {

        setLoading(true);
        setLocked(false);
        setResult(null);
        setTimedOut(false);
        setDeadline(null);
        setErrorMessage("");

        movingToNext.current =
          false;

        const {
          data,
          error,
        } = await supabase.rpc(
          "start_or_resume_question",
          {
            p_player_id:
              playerId,

            p_quiz_id:
              quizId,
          }
        );

        if (error) {
          console.error(
            "Question error:",
            error
          );

          setErrorMessage(
            error.message
          );

          setLoading(false);
          return;
        }

        /*
         * No questions remaining.
         */
        if (
  !data ||
  data.length === 0
) {
  setQuestion(null);
  setLoading(false);

  router.replace(
    `/${projectSlug}/${quizSlug}/results`
  );

  return;
}

        const loaded =
          data[0] as QuestionData;

        setQuestion(
          loaded
        );


        /*
         * Calculate remaining duration using
         * PostgreSQL timestamps.
         */
        const serverNow =
          new Date(
            loaded.server_now
          ).getTime();

        const startedAt =
          new Date(
            loaded.started_at
          ).getTime();

        const elapsed =
          serverNow -
          startedAt;

        const initialRemaining =
          Math.max(
            0,

            loaded.time_limit *
              1000 -
              elapsed
          );

        setDeadline(
          Date.now() +
            initialRemaining
        );

        setRemainingMs(
          initialRemaining
        );

        setLoading(false);
      },
           [
      router,
      projectSlug,
      quizSlug,
    ]
    );


  /*
   * Initial setup.
   */
  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);

      /*
       * Resolve URL -> quiz ID.
       */
      const {
        data,
        error,
      } = await supabase.rpc(
        "get_public_quiz",
        {
          p_project_slug:
            projectSlug,

          p_quiz_slug:
            quizSlug,
        }
      );

      if (
        error ||
        !data ||
        data.length === 0
      ) {
        if (active) {
          setErrorMessage(
            error?.message ??
              "Quiz not found."
          );

          setLoading(false);
        }

        return;
      }

      const loadedQuiz =
        data[0] as PublicQuiz;

      if (!active) {
        return;
      }

      setQuiz(
        loadedQuiz
      );

      quizIdRef.current =
        loadedQuiz.quiz_id;


      /*
       * Look up player specifically
       * for this quiz.
       */
      const playerId =
        localStorage.getItem(
          `quiz:${loadedQuiz.quiz_id}:playerId`
        );

      const storedLanguage =
        localStorage.getItem(
          `quiz:${loadedQuiz.quiz_id}:language`
        ) as Language | null;


      /*
       * Direct /quiz access without joining.
       */
      if (!playerId) {
        router.replace(
          `/${projectSlug}/${quizSlug}`
        );

        return;
      }

      playerIdRef.current =
        playerId;


      if (
        storedLanguage &&
        [
          "de",
          "en",
          "fr",
          "tr",
        ].includes(
          storedLanguage
        )
      ) {
        setLanguage(
          storedLanguage
        );
      }


      await loadQuestion(
        playerId,
        loadedQuiz.quiz_id
      );
    }

    initialize();

    return () => {
      active = false;

      if (
        nextQuestionTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          nextQuestionTimeoutRef.current
        );
      }
    };
  }, [
    projectSlug,
    quizSlug,
    loadQuestion,
    router,
  ]);


  /*
   * Timer.
   */
  useEffect(() => {
    if (
      deadline === null ||
      locked ||
      loading
    ) {
      return;
    }

    function updateTimer() {
      const remaining =
        Math.max(
          0,
          deadline! -
            Date.now()
        );

      setRemainingMs(
        remaining
      );
    }

    updateTimer();

    const interval =
      window.setInterval(
        updateTimer,
        50
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    deadline,
    locked,
    loading,
  ]);


  /*
   * Timeout.
   */
  useEffect(() => {
    if (
      remainingMs > 0 ||
      !question ||
      loading ||
      movingToNext.current
    ) {
      return;
    }

    const playerId =
      playerIdRef.current;

    const quizId =
      quizIdRef.current;

    if (
      !playerId ||
      !quizId
    ) {
      return;
    }

    movingToNext.current =
      true;

    setLocked(true);
    setTimedOut(true);


    /*
     * Briefly display "Time's up"
     * then continue.
     */
    nextQuestionTimeoutRef.current =
      window.setTimeout(
        () => {
          loadQuestion(
            playerId,
            quizId
          );
        },
        1200
      );

  }, [
    remainingMs,
    question,
    loading,
    loadQuestion,
  ]);


  /*
   * Submit answer.
   */
  async function chooseAnswer(
    choiceId: number
  ) {
    const playerId =
      playerIdRef.current;

    const quizId =
      quizIdRef.current;

    if (
      locked ||
      !question ||
      !playerId ||
      !quizId
    ) {
      return;
    }

    setLocked(true);
    setErrorMessage("");


    const {
      data,
      error,
    } = await supabase.rpc(
      "submit_quiz_answer",
      {
        p_player_id:
          playerId,

        p_quiz_id:
          quizId,

        p_question_id:
          question.question_id,

        p_choice_id:
          choiceId,
      }
    );


    if (error) {
      console.error(
        "Answer error:",
        error
      );

      setErrorMessage(
        error.message
      );

      setLocked(false);
      return;
    }


    if (
      !data ||
      data.length === 0
    ) {
      setErrorMessage(
        "No answer result returned."
      );

      setLocked(false);
      return;
    }


    const answerResult =
      data[0] as AnswerResult;

    setResult(
      answerResult
    );


    /*
     * Continue automatically.
     */
    nextQuestionTimeoutRef.current =
      window.setTimeout(
        () => {
          loadQuestion(
            playerId,
            quizId
          );
        },
        1300
      );
  }


  const text =
    translations[language];


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

        <p className="text-lg font-semibold text-gray-700">
          {text.loading}
        </p>

      </main>
    );
  }


  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

        <div className="w-full max-w-md rounded-xl bg-red-100 p-5 text-red-700">

          <p className="font-bold">
            {text.error}
          </p>

          <p className="mt-2 text-sm">
            {errorMessage}
          </p>

        </div>

      </main>
    );
  }

  if (!question) {
    return null;
  }


  const seconds =
    remainingMs /
    1000;


  const percentage =
    Math.max(
      0,

      Math.min(
        100,

        (
          remainingMs /
          (
            question.time_limit *
            1000
          )
        ) *
          100
      )
    );


return (
  <main className="min-h-screen bg-gray-100 px-4 py-6">

    <div className="mx-auto max-w-xl">

      {/* PROJECT IMAGE */}

    {quiz?.quiz_cover_image_url && (
        <img
          src={quiz.quiz_cover_image_url}
          alt={quiz.quiz_name}
          className="w-full object-contain max-w-[25vh] mx-auto"
        />
      )}

      {/* QUIZ NAME */}

      {quiz && (
        <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          {quiz.quiz_name}
        </p>
      )}


        {/* QUESTION + TIMER */}

        <div className="mb-4 flex items-center justify-between">

          <span className="font-semibold text-gray-600">
            {text.question}{" "}
            {
              question.question_position
            }
          </span>

          <span
            className={`rounded-full px-4 py-2 text-xl font-bold ${
              seconds <= 3
                ? "bg-red-100 text-red-700"
                : "bg-white text-gray-900"
            }`}
          >
            {seconds.toFixed(1)}
          </span>

        </div>


        {/* TIMER BAR */}

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-300">

          <div
            className="h-full bg-gray-900 transition-[width] duration-75"
            style={{
              width:
                `${percentage}%`,
            }}
          />

        </div>


        {/* QUESTION */}

        <section className="rounded-xl bg-white p-6 shadow">

          <h1 className="text-lg font-bold leading-snug text-gray-900 sm:text-3xl">

            {translate(
              question.question_text,
              language
            )}

          </h1>

        </section>


        {/* ANSWERS */}

        <div className="mt-5 grid gap-4">

          {question.answer_choices.map(
            (
              choice,
              index
            ) => (

              <button
                key={
                  choice.id
                }
                type="button"
                disabled={
                  locked
                }
                onClick={() =>
                  chooseAnswer(
                    choice.id
                  )
                }
                className="min-h-20 rounded-2xl border border-gray-300 bg-white p-5 text-left text-lg font-semibold text-gray-900 shadow-sm transition hover:border-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span className="mr-3 text-gray-400">
                  {String.fromCharCode(
                    65 + index
                  )}
                  .
                </span>

                {translate(
                  choice.answer_text,
                  language
                )}

              </button>

            )
          )}

        </div>


        {/* RESULT */}

        {result && (
          <div
            className={`mt-6 rounded-2xl p-5 text-center ${
              result.correct
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >

            <p className="text-xl font-bold">

              {result.correct
                ? text.correct
                : text.wrong}

            </p>

            {result.correct && (
              <p className="mt-1 font-semibold">

                +
                {
                  result.awarded_points
                }{" "}

                {
                  text.points
                }

              </p>
            )}

          </div>
        )}


        {/* TIMEOUT */}

        {timedOut && (
          <div className="mt-6 rounded-2xl bg-red-100 p-5 text-center text-xl font-bold text-red-800">

            {text.timeUp}

          </div>
        )}

      </div>

    </main>
  );
}