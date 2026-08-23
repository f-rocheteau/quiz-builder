"use client";

import {
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


type PublicQuiz = {
  project_id: string;
  project_name: string;
  project_slug: string;

  quiz_id: string;
  quiz_name: string;
  quiz_slug: string;

  quiz_cover_image_url: string | null;
};


const languages: {
  code: Language;
  label: string;
}[] = [
  {
    code: "de",
    label: "Deutsch",
  },
  {
    code: "en",
    label: "English",
  },
  {
    code: "fr",
    label: "Français",
  },
  {
    code: "tr",
    label: "Türkçe",
  },
];


const translations = {
  de: {
    chooseLanguage:
      "Wähle deine Sprache",
    nameQuestion:
      "Wie heißt du?",
    namePlaceholder:
      "Dein Name",
    start:
      "Quiz starten",
    starting:
      "Quiz wird gestartet...",
    back:
      "Zurück",
  },

  en: {
    chooseLanguage:
      "Choose your language",
    nameQuestion:
      "What's your name?",
    namePlaceholder:
      "Your name",
    start:
      "Start quiz",
    starting:
      "Starting...",
    back:
      "Back",
  },

  fr: {
    chooseLanguage:
      "Choisissez votre langue",
    nameQuestion:
      "Comment vous appelez-vous ?",
    namePlaceholder:
      "Votre nom",
    start:
      "Commencer le quiz",
    starting:
      "Démarrage...",
    back:
      "Retour",
  },

  tr: {
    chooseLanguage:
      "Dilinizi seçin",
    nameQuestion:
      "Adınız nedir?",
    namePlaceholder:
      "Adınız",
    start:
      "Yarışmayı başlat",
    starting:
      "Başlatılıyor...",
    back:
      "Geri",
  },
};


export default function PublicQuizPage() {
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
    selectedLanguage,
    setSelectedLanguage,
  ] =
    useState<Language | null>(
      null
    );


  const [name, setName] =
    useState("");


  const [loading, setLoading] =
    useState(true);


  const [joining, setJoining] =
    useState(false);


  const [
    notFound,
    setNotFound,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  /*
   * Load public quiz information.
   */
  useEffect(() => {
    async function loadQuiz() {
      setLoading(true);
      setErrorMessage("");

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

      if (error) {
        console.error(
          "Quiz load error:",
          error
        );

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
        setNotFound(true);
        setLoading(false);
        return;
      }
console.log(
  "PUBLIC QUIZ RPC:",
  data[0]
);

      setQuiz(
        data[0] as PublicQuiz
      );

      setLoading(false);
    }


    loadQuiz();

  }, [
    projectSlug,
    quizSlug,
  ]);


  /*
   * Register guest for THIS quiz.
   */
  async function joinQuiz() {
    if (
      !quiz ||
      !selectedLanguage
    ) {
      return;
    }


    const cleanName =
      name.trim();


    if (!cleanName) {
      setErrorMessage(
        "Please enter your name."
      );

      return;
    }


    setJoining(true);
    setErrorMessage("");


    const playerId =
      crypto.randomUUID();


    const {
      error,
    } = await supabase
      .from("players")
      .insert({
        id: playerId,

        quiz_id:
          quiz.quiz_id,

        name:
          cleanName,

        language:
          selectedLanguage,
      });


    if (error) {
      console.error(
        "Join error:",
        error
      );

      setErrorMessage(
        error.message
      );

      setJoining(false);
      return;
    }


    /*
     * Store player data specifically
     * for this quiz.
     */
    localStorage.setItem(
      `quiz:${quiz.quiz_id}:playerId`,
      playerId
    );

    localStorage.setItem(
      `quiz:${quiz.quiz_id}:language`,
      selectedLanguage
    );

    localStorage.setItem(
      `quiz:${quiz.quiz_id}:playerName`,
      cleanName
    );


    localStorage.setItem(
      "activeQuizId",
      quiz.quiz_id
    );


    /*
     * Start quiz.
     */
    router.push(
      `/${projectSlug}/${quizSlug}/quiz`
    );
  }


  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">

        <p className="text-gray-600">
          Loading quiz...
        </p>

      </main>
    );
  }


  /*
   * NOT FOUND
   */
  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">

          <h1 className="text-3xl font-bold text-gray-900">
            Quiz not found
          </h1>

          <p className="mt-3 text-gray-600">
            This quiz does not exist or is not published.
          </p>

        </div>

      </main>
    );
  }


  if (!quiz) {
    return null;
  }
const quizImage = quiz.quiz_cover_image_url ? (
  <img
    src={quiz.quiz_cover_image_url}
    alt={quiz.quiz_name}
    className="w-full object-contain"
  />
) : null;

  /*
   * STEP 1
   *
   * LANGUAGE SELECTION
   */
if (!selectedLanguage) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">

      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow">

        {quizImage}

        <div className="p-8">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {quiz.project_name}
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              {quiz.quiz_name}
            </h1>

            <p className="mt-5 text-lg text-gray-600">
              Choose your language
            </p>

          </div>

          <div className="mt-8 space-y-3">

            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() =>
                  setSelectedLanguage(
                    language.code
                  )
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-left text-lg font-semibold text-gray-900 transition hover:border-black hover:bg-gray-50"
              >
                {language.label}
              </button>
            ))}

          </div>

        </div>

      </div>

    </main>
  );
}


const text =
  translations[selectedLanguage];

  /*
   * STEP 2
   *
   * ENTER NAME
   */
return (
  <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">

    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow">

      {quizImage}

      <div className="p-8">

        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {quiz.project_name}
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            {quiz.quiz_name}
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            {text.nameQuestion}
          </p>

        </div>

        <input
          type="text"
          autoFocus
          maxLength={50}
          value={name}
          placeholder={text.namePlaceholder}
          onChange={(event) => {
            setName(event.target.value);
            setErrorMessage("");
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !joining &&
              name.trim()
            ) {
              joinQuiz();
            }
          }}
          className="mt-7 w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-lg text-gray-900 outline-none focus:border-black"
        />

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-100 p-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          disabled={
            joining ||
            !name.trim()
          }
          onClick={joinQuiz}
          className="mt-5 w-full rounded-xl bg-black px-5 py-4 text-lg font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
        >
          {joining
            ? text.starting
            : text.start}
        </button>

        <button
          type="button"
          disabled={joining}
          onClick={() => {
            setSelectedLanguage(null);
            setErrorMessage("");
          }}
          className="mt-3 w-full rounded-xl px-5 py-3 font-semibold text-gray-600 hover:bg-gray-100"
        >
          ← {text.back}
        </button>

      </div>

    </div>

  </main>
);
}