"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import Link from "next/link";

import {
  supabase,
} from "@/lib/supabase";


type LeaderboardRow = {
  project_name: string;
  player_name: string;
  total_points: number;
  quizzes_played: number;
  rank_position: number;
};


type ProjectQuiz = {
  quiz_id: string;
  quiz_name: string;
  quiz_slug: string;
};


export default function ProjectLeaderboardPage() {

  const params =
    useParams<{
      projectSlug: string;
    }>();


  const projectSlug =
    params.projectSlug;


  const [
    leaderboard,
    setLeaderboard,
  ] =
    useState<LeaderboardRow[]>([]);


  const [
    quizzes,
    setQuizzes,
  ] =
    useState<ProjectQuiz[]>([]);


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
   * Load project leaderboard
   * and all public quizzes.
   */
  useEffect(() => {

    async function loadData() {

      const [
        leaderboardResult,
        quizzesResult,
      ] =
        await Promise.all([

          supabase.rpc(
            "get_project_leaderboard",
            {
              p_project_slug:
                projectSlug,
            }
          ),

          supabase.rpc(
            "get_public_project_quizzes",
            {
              p_project_slug:
                projectSlug,
            }
          ),

        ]);


      /*
       * Leaderboard error.
       */
      if (
        leaderboardResult.error
      ) {

        console.error(
          "Project leaderboard error:",
          leaderboardResult.error
        );

        setErrorMessage(
          leaderboardResult.error.message
        );

        setLoading(false);

        return;
      }


      /*
       * Quiz list error.
       */
      if (
        quizzesResult.error
      ) {

        console.error(
          "Project quizzes error:",
          quizzesResult.error
        );

        setErrorMessage(
          quizzesResult.error.message
        );

        setLoading(false);

        return;
      }


      setLeaderboard(
        (
          leaderboardResult.data ??
          []
        ) as LeaderboardRow[]
      );


      setQuizzes(
        (
          quizzesResult.data ??
          []
        ) as ProjectQuiz[]
      );


      setErrorMessage("");

      setLoading(false);
    }


    /*
     * Initial load.
     */
    loadData();


    /*
     * Refresh every 3 seconds.
     */
    const interval =
      window.setInterval(
        loadData,
        3000
      );


    return () => {

      window.clearInterval(
        interval
      );

    };

  }, [
    projectSlug,
  ]);


  /*
   * Loading state.
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
   * Get project name.
   */
  const projectName =
    leaderboard.length > 0
      ? leaderboard[0].project_name
      : projectSlug;


  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-2xl">

        <div className="rounded-3xl bg-white p-6 shadow sm:p-8">


          {/* HEADER */}

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {projectName}
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Overall Leaderboard
            </h1>

            <p className="mt-3 text-gray-600">
              Scores across all quizzes
            </p>

          </div>


          {/* QUIZ LEADERBOARD LINKS */}

          {quizzes.length > 0 && (

            <div className="mt-7">

              <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                Quiz Leaderboards
              </p>

              <div className="flex flex-wrap justify-center gap-2">

                {quizzes.map(
                  (quiz) => (

                    <Link
                      key={
                        quiz.quiz_id
                      }
                      href={
                        `/${projectSlug}/${quiz.quiz_slug}/leaderboard`
                      }
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900 transition hover:border-black hover:bg-gray-50"
                    >
                      {
                        quiz.quiz_name
                      }
                    </Link>

                  )
                )}

              </div>

            </div>

          )}


          {/* ERROR */}

          {errorMessage && (

            <div className="mt-6 rounded-xl bg-red-100 p-4 text-red-700">

              {errorMessage}

            </div>

          )}


          {/* EMPTY STATE */}

          {!errorMessage &&
            leaderboard.length === 0 && (

              <div className="mt-8 text-center text-gray-500">

                No results yet.

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
                      `${player.player_name}-${index}`
                    }
                    className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                  >


                    {/* POSITION */}

                    <div className="w-12 shrink-0 text-center">

                      {player.rank_position === 1 ? (

                        <span className="text-2xl">
                          🥇
                        </span>

                      ) : player.rank_position === 2 ? (

                        <span className="text-2xl">
                          🥈
                        </span>

                      ) : player.rank_position === 3 ? (

                        <span className="text-2xl">
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


                    {/* PLAYER */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-lg font-semibold text-gray-900">

                        {
                          player.player_name
                        }

                      </p>

                      <p className="text-sm text-gray-500">

                        {
                          player.quizzes_played
                        }{" "}

                        {
                          player.quizzes_played === 1
                            ? "quiz"
                            : "quizzes"
                        }

                      </p>

                    </div>


                    {/* SCORE */}

                    <div className="shrink-0 text-right">

                      <p className="text-xl font-bold text-gray-900">

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


          {/* QUIZ LINKS AGAIN ON BOTTOM */}

          {quizzes.length > 0 && (

            <div className="mt-10 border-t border-gray-200 pt-6">

              <p className="mb-4 text-center text-sm font-semibold text-gray-600">
                View individual quiz leaderboards
              </p>

              <div className="space-y-2">

                {quizzes.map(
                  (quiz) => (

                    <Link
                      key={
                        quiz.quiz_id
                      }
                      href={
                        `/${projectSlug}/${quiz.quiz_slug}/leaderboard`
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-900 transition hover:border-black hover:bg-gray-50"
                    >

                      <span>
                        {
                          quiz.quiz_name
                        }
                      </span>

                      <span>
                        →
                      </span>

                    </Link>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}