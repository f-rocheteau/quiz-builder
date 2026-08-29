"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase";


type PublicQuiz = {
  project_id: string;
  project_name: string;
  project_slug: string;

  quiz_id: string;
  quiz_name: string;
  quiz_slug: string;

  quiz_cover_image_url: string | null;
};


type LeaderboardRow = {
  player_id: string;
  player_name: string;
  total_points: number;
  rank_position: number;
};


export default function QuizLeaderboardPage() {

  const params =
    useParams<{
      projectSlug: string;
      quizSlug: string;
    }>();


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
    leaderboard,
    setLeaderboard,
  ] =
    useState<LeaderboardRow[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  /*
   * Load quiz information first.
   *
   * We need the quiz ID for the
   * quiz-specific leaderboard RPC.
   */
  useEffect(() => {

    let interval:
      ReturnType<typeof setInterval>
      | undefined;


    async function loadPage() {

      /*
       * Get public quiz information.
       */
      const {
        data: quizData,
        error: quizError,
      } =
        await supabase.rpc(
          "get_public_quiz",
          {
            p_project_slug:
              projectSlug,

            p_quiz_slug:
              quizSlug,
          }
        );


      if (quizError) {

        console.error(
          "Quiz load error:",
          quizError
        );

        setErrorMessage(
          quizError.message
        );

        setLoading(false);

        return;
      }


      if (
        !quizData ||
        quizData.length === 0
      ) {

        setErrorMessage(
          "Quiz not found."
        );

        setLoading(false);

        return;
      }


      const loadedQuiz =
        quizData[0] as PublicQuiz;


      setQuiz(
        loadedQuiz
      );


      /*
       * Function that loads the
       * leaderboard for THIS quiz.
       */
      async function loadLeaderboard() {

        const {
          data,
          error,
        } =
          await supabase.rpc(
            "get_leaderboard",
            {
              p_quiz_id:
                loadedQuiz.quiz_id,
            }
          );


        if (error) {

          console.error(
            "Leaderboard load error:",
            error
          );

          setErrorMessage(
            error.message
          );

          setLoading(false);

          return;
        }


        /*
         * Normalize the RPC result.
         *
         * This also makes the page tolerant
         * if the RPC currently calls the
         * columns rank / score / name instead
         * of rank_position /
         * total_points / player_name.
         */
        const rows =
          (data ?? []).map(
            (
              row:
                Record<
                  string,
                  unknown
                >,
              index: number
            ) => {

              const playerName =
                String(
                  row.player_name ??
                  row.name ??
                  "Player"
                );


              const totalPoints =
                Number(
                  row.total_points ??
                  row.points ??
                  row.score ??
                  0
                );


              const rankPosition =
                Number(
                  row.rank_position ??
                  row.rank ??
                  index + 1
                );


              const playerId =
                String(
                  row.player_id ??
                  `${playerName}-${index}`
                );


              return {
                player_id:
                  playerId,

                player_name:
                  playerName,

                total_points:
                  totalPoints,

                rank_position:
                  rankPosition,
              };
            }
          );


        setLeaderboard(
          rows
        );

        setErrorMessage("");

        setLoading(false);
      }


      /*
       * Initial leaderboard load.
       */
      await loadLeaderboard();


      /*
       * Refresh leaderboard
       * automatically every 3 seconds.
       */
      interval =
        setInterval(
          loadLeaderboard,
          3000
        );
    }


    loadPage();


    return () => {

      if (interval) {

        clearInterval(
          interval
        );

      }

    };

  }, [
    projectSlug,
    quizSlug,
  ]);


  /*
   * Loading
   */
  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <p className="text-gray-600">
          Loading leaderboard...
        </p>

      </main>
    );
  }


  /*
   * Error before quiz could be loaded.
   */
  if (
    errorMessage &&
    !quiz
  ) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow">

          <h1 className="text-2xl font-bold text-gray-900">
            Unable to load leaderboard
          </h1>

          <p className="mt-4 text-red-600">
            {errorMessage}
          </p>

        </div>

      </main>
    );
  }


  if (!quiz) {
    return null;
  }


  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-2xl">


        {/* COMPLETE LEADERBOARD CARD */}

        <div className="overflow-hidden rounded-3xl bg-white shadow">


          {/* QUIZ IMAGE */}

          {quiz.quiz_cover_image_url && (

            <img
              src={
                quiz.quiz_cover_image_url
              }
              alt={
                quiz.quiz_name
              }
              className="w-full object-contain max-w-[15vh] mx-auto"
            />

          )}


          {/* CONTENT */}

          <div className="p-6 sm:p-8">


            {/* HEADER */}

            <div className="text-center">

              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {quiz.project_name}
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                {quiz.quiz_name}
              </h1>

              <p className="mt-2 text-m font-semibold text-gray-600">
                Leaderboard
              </p>


              {/* PROJECT LEADERBOARD */}

              <Link
                href={
                  `/${projectSlug}/leaderboard`
                }
                className="mt-5 inline-block rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:border-black hover:bg-gray-50"
              >
                Overall Leaderboard
              </Link>

            </div>


            {/* ERROR */}

            {errorMessage && (

              <div className="mt-6 rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-700">

                {errorMessage}

              </div>

            )}


            {/* NO PLAYERS */}

            {!errorMessage &&
              leaderboard.length === 0 && (

                <div className="mt-8 text-center">

                  <p className="text-gray-500">
                    No results yet.
                  </p>

                </div>

              )}


            {/* LEADERBOARD */}

            {leaderboard.length > 0 && (

              <div className="mt-8 space-y-3">

                {leaderboard.map(
                  (
                    player,
                    index
                  ) => (

                    <div
                      key={
                        `${player.player_id}-${index}`
                      }
                      className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                    >


                      {/* POSITION */}

                      <div className="w-12 shrink-0 text-center">

                        {player.rank_position === 1 ? (

                          <span className="text-xl">
                            🥇
                          </span>

                        ) :
                        player.rank_position === 2 ? (

                          <span className="text-xl">
                            🥈
                          </span>

                        ) :
                        player.rank_position === 3 ? (

                          <span className="text-xl">
                            🥉
                          </span>

                        ) : (

                          <span className="text-lg font-bold text-gray-500">

                            #
                            {
                              player.rank_position
                            }

                          </span>

                        )}

                      </div>


                      {/* PLAYER NAME */}

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-lg font-semibold text-gray-900">

                          {
                            player.player_name
                          }

                        </p>

                      </div>


                      {/* SCORE */}

                      <div className="shrink-0 text-right">

                        <p className="text-lg font-bold text-gray-900">

                          {
                            player.total_points
                          }

                        </p>

                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          points
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}


            {/* PROJECT LEADERBOARD BOTTOM LINK */}

            <div className="mt-8 border-t border-gray-200 pt-6">

              <Link
                href={
                  `/${projectSlug}/leaderboard`
                }
                className="flex w-full items-center justify-between rounded-xl border border-gray-300 px-5 py-4 font-semibold text-gray-900 transition hover:border-black hover:bg-gray-50"
              >

                <span>
                  View Overall Leaderboard
                </span>

                <span>
                  →
                </span>

              </Link>

            </div>


          </div>

        </div>

      </div>

    </main>
  );
}