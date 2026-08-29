"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";


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
  is_correct: boolean;
};


type Question = {
  id: number;
  position: number;
  question_text: Translation;
  time_limit: number;
  choices: Choice[];
};


type Project = {
  id: string;
  name: string;
  slug: string;
};


type Quiz = {
  id: string;
  project_id: string;
  name: string;
  slug: string;

  cover_image_url: string | null;
  cover_image_path: string | null;
};


function getText(
  value: Translation
) {
  return (
    value.en ??
    value.de ??
    value.fr ??
    value.tr ??
    ""
  );
}


export default function QuizQuestionsPage() {
  const params = useParams();
  const router = useRouter();

  const projectId =
    params.projectId as string;

  const quizId =
    params.quizId as string;


  const [
    project,
    setProject,
  ] =
    useState<Project | null>(
      null
    );


  const [
    quiz,
    setQuiz,
  ] =
    useState<Quiz | null>(
      null
    );


  const [
    questions,
    setQuestions,
  ] =
    useState<Question[]>([]);


  const [loading, setLoading] =
    useState(true);


  const [
    uploadingImage,
    setUploadingImage,
  ] =
    useState(false);


  const [
    removingImage,
    setRemovingImage,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  /*
   * LOAD PROJECT + QUIZ + QUESTIONS
   */
  const loadData =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");


      /*
       * PROJECT
       */
      const {
        data: projectData,
        error: projectError,
      } =
        await supabase
          .from("projects")
          .select(
            "id, name, slug"
          )
          .eq(
            "id",
            projectId
          )
          .single();


      if (
        projectError ||
        !projectData
      ) {
        setErrorMessage(
          projectError?.message ??
            "Project not found."
        );

        setLoading(false);
        return;
      }


      setProject(
        projectData as Project
      );


      /*
       * QUIZ
       */
      const {
        data: quizData,
        error: quizError,
      } =
        await supabase
          .from("quizzes")
          .select(`
            id,
            project_id,
            name,
            slug,
            cover_image_url,
            cover_image_path
          `)
          .eq(
            "id",
            quizId
          )
          .eq(
            "project_id",
            projectId
          )
          .single();


      if (
        quizError ||
        !quizData
      ) {
        setErrorMessage(
          quizError?.message ??
            "Quiz not found."
        );

        setLoading(false);
        return;
      }


      setQuiz(
        quizData as Quiz
      );


      /*
       * QUESTIONS
       */
      const {
        data: questionData,
        error: questionError,
      } =
        await supabase
          .from("questions")
          .select(`
            id,
            position,
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
            "quiz_id",
            quizId
          )
          .order(
            "position",
            {
              ascending: true,
            }
          );


      if (questionError) {
        setErrorMessage(
          questionError.message
        );

        setLoading(false);
        return;
      }


      const sortedQuestions =
        (
          questionData ?? []
        ).map(
          (question) => ({
            ...question,

            choices: [
              ...(
                question.choices ??
                []
              ),
            ].sort(
              (a, b) =>
                a.position -
                b.position
            ),
          })
        );


      setQuestions(
        sortedQuestions as Question[]
      );

      setLoading(false);

    }, [
      projectId,
      quizId,
    ]);


  useEffect(() => {
    loadData();
  }, [loadData]);


  /*
   * IMAGE UPLOAD
   */
async function uploadQuizImage(
  event: ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file || !quiz) {
    return;
  }

  setErrorMessage("");
  setSuccessMessage("");

  /*
   * Allowed image formats.
   */
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    setErrorMessage(
      "Please upload a JPG, PNG or WebP image."
    );

    event.target.value = "";
    return;
  }

  /*
   * Max 5 MB.
   */
  if (file.size > 5 * 1024 * 1024) {
    setErrorMessage(
      "The image must be smaller than 5 MB."
    );

    event.target.value = "";
    return;
  }

  setUploadingImage(true);


    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";


    /*
     * Store per quiz.
     */
    const filePath =
      `quizzes/${quizId}/cover-${crypto.randomUUID()}.${extension}`;


    /*
     * Upload NEW image first.
     */
    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          "project-assets"
        )
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,
          }
        );


    if (uploadError) {
      setErrorMessage(
        uploadError.message
      );

      setUploadingImage(false);

      event.target.value = "";

      return;
    }


    /*
     * Generate public URL.
     */
    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from(
          "project-assets"
        )
        .getPublicUrl(
          filePath
        );


    /*
     * Save URL + path to quiz.
     */
    const {
      error: updateError,
    } =
      await supabase
        .from("quizzes")
        .update({
          cover_image_url:
            publicUrlData.publicUrl,

          cover_image_path:
            filePath,
        })
        .eq(
          "id",
          quizId
        )
        .eq(
          "project_id",
          projectId
        );


    if (updateError) {
      /*
       * Remove orphaned upload.
       */
      await supabase.storage
        .from(
          "project-assets"
        )
        .remove([
          filePath,
        ]);

      setErrorMessage(
        updateError.message
      );

      setUploadingImage(false);

      event.target.value = "";

      return;
    }


    /*
     * Remove OLD image only after
     * DB update succeeded.
     */
    if (
      quiz.cover_image_path
    ) {
      await supabase.storage
        .from(
          "project-assets"
        )
        .remove([
          quiz.cover_image_path,
        ]);
    }


    setSuccessMessage(
      "Quiz image updated."
    );


    await loadData();

    setUploadingImage(false);

    event.target.value = "";
  }


  /*
   * REMOVE IMAGE
   */
  async function removeQuizImage() {
    if (
      !quiz ||
      !quiz.cover_image_path
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        "Remove this quiz image?"
      );


    if (!confirmed) {
      return;
    }


    setRemovingImage(true);
    setErrorMessage("");
    setSuccessMessage("");


    const oldPath =
      quiz.cover_image_path;


    /*
     * Remove relation from DB first.
     */
    const {
      error: updateError,
    } =
      await supabase
        .from("quizzes")
        .update({
          cover_image_url:
            null,

          cover_image_path:
            null,
        })
        .eq(
          "id",
          quizId
        )
        .eq(
          "project_id",
          projectId
        );


    if (updateError) {
      setErrorMessage(
        updateError.message
      );

      setRemovingImage(false);
      return;
    }


    /*
     * Delete actual file.
     */
    const {
      error: storageError,
    } =
      await supabase.storage
        .from(
          "project-assets"
        )
        .remove([
          oldPath,
        ]);


    if (storageError) {
      console.error(
        "Image delete error:",
        storageError
      );
    }


    setSuccessMessage(
      "Quiz image removed."
    );


    await loadData();

    setRemovingImage(false);
  }


  /*
   * DELETE QUESTION
   */
  async function deleteQuestion(
    questionId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this question?"
      );


    if (!confirmed) {
      return;
    }


    setErrorMessage("");


    const {
      error,
    } =
      await supabase
        .from("questions")
        .delete()
        .eq(
          "id",
          questionId
        )
        .eq(
          "quiz_id",
          quizId
        );


    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }


    await loadData();
  }


  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">

        <p className="text-gray-600">
          Loading...
        </p>

      </main>
    );
  }


  /*
   * ERROR
   */
  if (
    errorMessage &&
    (
      !project ||
      !quiz
    )
  ) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">

        <div className="mx-auto max-w-5xl rounded-xl bg-red-100 p-5 text-red-700">

          {errorMessage}

        </div>

      </main>
    );
  }


  if (
    !project ||
    !quiz
  ) {
    return null;
  }


  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-5xl">


        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/projects/${projectId}`
            )
          }
          className="mb-5 font-semibold text-gray-600 hover:text-black"
        >
          ← {project.name}
        </button>


        {/* QUIZ HEADER */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Quiz
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {quiz.name}
          </h1>

          <p className="mt-2 text-gray-500">
            /{project.slug}/{quiz.slug}
          </p>

        </div>


        {/* ERROR */}

        {errorMessage && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-red-700">

            {errorMessage}

          </div>
        )}


        {/* SUCCESS */}

        {successMessage && (
          <div className="mb-6 rounded-xl bg-green-100 p-4 text-green-800">

            {successMessage}

          </div>
        )}


        {/* =====================================
            QUIZ IMAGE
            ===================================== */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow">

          <h2 className="text-xl font-bold text-gray-900">
            Quiz image
          </h2>

          <p className="mt-2 text-gray-600">
            This image is shown to guests for this quiz.
          </p>


          {quiz.cover_image_url ? (

            <div className="mt-5">

              <img
                src={
                  quiz.cover_image_url
                }
                alt={
                  quiz.name
                }
                className="w-full object-contain max-w-[25vh] mx-auto"
              />

            </div>

          ) : (

            <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">

              No image uploaded yet.

            </div>

          )}


          <div className="mt-5 flex flex-wrap gap-3">


            {/* ADD / REPLACE */}

            <label
              className={`cursor-pointer rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 ${
                uploadingImage
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >

              {uploadingImage
                ? "Uploading..."
                : quiz.cover_image_url
                  ? "Replace image"
                  : "Upload image"}


              <input
  type="file"
  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={
                  uploadingImage
                }
                onChange={
                  uploadQuizImage
                }
                className="hidden"
              />

            </label>


            {/* REMOVE */}

            {quiz.cover_image_url && (

              <button
                type="button"
                disabled={
                  removingImage
                }
                onClick={
                  removeQuizImage
                }
                className="rounded-lg border border-red-300 bg-white px-5 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >

                {removingImage
                  ? "Removing..."
                  : "Remove image"}

              </button>

            )}

          </div>

        </section>


        {/* QUESTIONS HEADER */}

        <div className="mb-5 flex items-center justify-between gap-4">

          <div>

            <h2 className="text-2xl font-bold text-gray-900">
              Questions
            </h2>

            <p className="mt-1 text-gray-500">

              {questions.length}{" "}

              {questions.length === 1
                ? "question"
                : "questions"}

            </p>

          </div>


          <Link
            href={`/admin/projects/${projectId}/quizzes/${quizId}/questions/new`}
            className="rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            + Add Question
          </Link>

        </div>


        {/* NO QUESTIONS */}

        {questions.length === 0 ? (

          <div className="rounded-2xl bg-white p-10 text-center shadow">

            <h3 className="text-xl font-bold text-gray-900">
              No questions yet
            </h3>

            <p className="mt-2 text-gray-500">
              Add the first question to this quiz.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {questions.map(
              (question) => (

                <section
                  key={
                    question.id
                  }
                  className="rounded-2xl bg-white p-6 shadow"
                >

                  <div className="flex items-start justify-between gap-5">

                    <div className="min-w-0">

                      <p className="text-sm font-semibold text-gray-500">

                        Question{" "}
                        {
                          question.position
                        }

                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">

                        {getText(
                          question.question_text
                        )}

                      </h3>

                      <p className="mt-1 text-sm text-gray-500">

                        {
                          question.time_limit
                        }{" "}
                        seconds

                      </p>

                    </div>


                    <div className="flex shrink-0 gap-2">

                      <Link
                        href={`/admin/projects/${projectId}/quizzes/${quizId}/questions/${question.id}/edit`}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                      >
                        Edit
                      </Link>


                      <button
                        type="button"
                        onClick={() =>
                          deleteQuestion(
                            question.id
                          )
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                    </div>

                  </div>


                  {/* ANSWERS */}

                  <div className="mt-5 space-y-2">

                    {question.choices.map(
                      (choice) => (

                        <div
                          key={
                            choice.id
                          }
                          className={`rounded-lg border p-3 ${
                            choice.is_correct
                              ? "border-green-400 bg-green-50"
                              : "border-gray-200"
                          }`}
                        >

                          <span className="text-gray-900">

                            {
                              choice.position
                            }
                            .{" "}

                            {getText(
                              choice.answer_text
                            )}

                          </span>


                          {choice.is_correct && (

                            <span className="ml-2 font-bold text-green-700">
                              ✓ Correct
                            </span>

                          )}

                        </div>

                      )
                    )}

                  </div>

                </section>

              )
            )}

          </div>

        )}

      </div>

    </main>
  );
}