"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

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

type PublicQuiz = {
  project_id: string;
  project_name: string;
  project_slug: string;

  quiz_id: string;
  quiz_name: string;
  quiz_slug: string;

  quiz_cover_image_url: string | null;
};

type PlayerResult = {
  player_name: string;
  total_score: number;
  rank_position: number;
  total_players: number;
  correct_answers: number;
  answered_questions: number;
  total_questions: number;
  finished: boolean;
};

const translations = {
  de: {
    finished: "Quiz beendet",
    score: "Punkte",
    rank: "Platz",
    correct: "Richtig",
    answered: "Beantwortet",
    leaderboard: "Leaderboard ansehen",
    loading: "Ergebnis wird geladen...",
    error: "Ergebnis konnte nicht geladen werden.",
  },

  en: {
    finished: "Quiz complete",
    score: "Score",
    rank: "Rank",
    correct: "Correct",
    answered: "Answered",
    leaderboard: "View leaderboard",
    loading: "Loading result...",
    error: "Could not load result.",
  },

  fr: {
    finished: "Quiz terminé",
    score: "Points",
    rank: "Classement",
    correct: "Correctes",
    answered: "Répondues",
    leaderboard: "Voir le classement",
    loading: "Chargement du résultat...",
    error: "Impossible de charger le résultat.",
  },

  tr: {
    finished: "Yarışma tamamlandı",
    score: "Puan",
    rank: "Sıra",
    correct: "Doğru",
    answered: "Cevaplanan",
    leaderboard: "Sıralamayı görüntüle",
    loading: "Sonuç yükleniyor...",
    error: "Sonuç yüklenemedi.",
  },
};

export default function ResultsPage() {
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

  const [quiz, setQuiz] =
    useState<PublicQuiz | null>(
      null
    );

  const [result, setResult] =
    useState<PlayerResult | null>(
      null
    );

  const [language, setLanguage] =
    useState<Language>("en");

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    let refreshInterval:
      number | null = null;

    async function initialize() {
      /*
       * Resolve URL to quiz.
       */
      const {
        data: quizData,
        error: quizError,
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
        quizError ||
        !quizData ||
        quizData.length === 0
      ) {
        if (active) {
          setErrorMessage(
            quizError?.message ??
              "Quiz not found."
          );

          setLoading(false);
        }

        return;
      }

      const loadedQuiz =
        quizData[0] as PublicQuiz;

      if (!active) {
        return;
      }

      setQuiz(
        loadedQuiz
      );

      /*
       * Read player for this quiz.
       */
      const playerId =
        localStorage.getItem(
          `quiz:${loadedQuiz.quiz_id}:playerId`
        );

      const storedLanguage =
        localStorage.getItem(
          `quiz:${loadedQuiz.quiz_id}:language`
        ) as Language | null;

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

      /*
       * Results are private to the
       * current browser/player.
       */
      if (!playerId) {
        router.replace(
          `/${projectSlug}/${quizSlug}`
        );

        return;
      }

      async function loadResult() {
        const {
          data,
          error,
        } = await supabase.rpc(
          "get_player_result",
          {
            p_player_id:
              playerId,

            p_quiz_id:
              loadedQuiz.quiz_id,
          }
        );

        if (!active) {
          return;
        }

        if (error) {
          setErrorMessage(
            error.message
          );

          setLoading(false);
          return;
        }

        if (
          !data ||
          data.length === 0
        ) {
          setErrorMessage(
            "Player result not found."
          );

          setLoading(false);
          return;
        }

        setResult(
          data[0] as PlayerResult
        );

        setLoading(false);
      }

      await loadResult();

      /*
       * Rank can change while other
       * guests are still playing.
       */
      refreshInterval =
        window.setInterval(
          loadResult,
          5000
        );
    }

    initialize();

    return () => {
      active = false;

      if (
        refreshInterval !== null
      ) {
        window.clearInterval(
          refreshInterval
        );
      }
    };
  }, [
    projectSlug,
    quizSlug,
    router,
  ]);

  const text =
    translations[language];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

        <p className="font-semibold text-gray-700">
          {text.loading}
        </p>

      </main>
    );
  }

  if (
    errorMessage ||
    !quiz ||
    !result
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

        <div className="w-full max-w-md rounded-2xl bg-red-100 p-6 text-red-700">

          <p className="font-bold">
            {text.error}
          </p>

          {errorMessage && (
            <p className="mt-2 text-sm">
              {errorMessage}
            </p>
          )}

        </div>

      </main>
    );
  }

return (
  <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">

    <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow">

      {/* PROJECT IMAGE */}

      {quiz.quiz_cover_image_url && (
        <img
          src={quiz.quiz_cover_image_url}
          alt={quiz.quiz_name}
          className="mb-6 w-full rounded-2xl object-contain"
        />
      )}

      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {quiz.project_name}
      </p>

      <p className="mt-1 text-lg font-semibold text-gray-700">
        {quiz.quiz_name}
      </p>

        <div className="mx-auto mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
          ✓
        </div>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">
          {text.finished}
        </h1>

        <p className="mt-2 text-xl font-semibold text-gray-700">
          {result.player_name}
        </p>

        {/* SCORE */}

        <div className="mt-8 rounded-2xl bg-gray-900 p-7 text-white">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            {text.score}
          </p>

          <p className="mt-2 text-5xl font-bold">
            {result.total_score}
          </p>

        </div>

        {/* STATS */}

        <div className="mt-5 grid grid-cols-3 gap-3">

          <div className="rounded-xl bg-gray-100 p-4">

            <p className="text-sm text-gray-500">
              {text.rank}
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              #{result.rank_position}
            </p>

            <p className="text-xs text-gray-500">
              / {result.total_players}
            </p>

          </div>

          <div className="rounded-xl bg-gray-100 p-4">

            <p className="text-sm text-gray-500">
              {text.correct}
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {result.correct_answers}
            </p>

            <p className="text-xs text-gray-500">
              / {result.total_questions}
            </p>

          </div>

          <div className="rounded-xl bg-gray-100 p-4">

            <p className="text-sm text-gray-500">
              {text.answered}
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {result.answered_questions}
            </p>

            <p className="text-xs text-gray-500">
              / {result.total_questions}
            </p>

          </div>

        </div>

        {/* LEADERBOARD */}

        <Link
          href={`/${projectSlug}/${quizSlug}/leaderboard`}
          className="mt-7 block w-full rounded-xl bg-black px-5 py-4 text-lg font-semibold text-white hover:bg-gray-800"
        >
          {text.leaderboard}
        </Link>

      </div>

    </main>
  );
}