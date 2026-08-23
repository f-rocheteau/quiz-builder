"use client";

import {
  FormEvent,
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

type Project = {
  id: string;
  name: string;
  slug: string;
};

type Quiz = {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();

  const projectId =
    params.projectId as string;

  const [project, setProject] =
    useState<Project | null>(null);

  const [quizzes, setQuizzes] =
    useState<Quiz[]>([]);

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadProject =
    useCallback(async () => {

      const { data, error } =
        await supabase
          .from("projects")
          .select("id, name, slug")
          .eq("id", projectId)
          .single();

      if (error || !data) {
        setErrorMessage(
          error?.message ??
            "Project not found."
        );

        setLoading(false);
        return;
      }

      setProject(
        data as Project
      );

    }, [projectId]);

  const loadQuizzes =
    useCallback(async () => {

      const { data, error } =
        await supabase
          .from("quizzes")
          .select(
            "id, name, slug, is_published"
          )
          .eq(
            "project_id",
            projectId
          )
          .order(
            "created_at",
            { ascending: false }
          );

      if (error) {
        setErrorMessage(
          error.message
        );

        return;
      }

      setQuizzes(
        (data ?? []) as Quiz[]
      );

    }, [projectId]);

  useEffect(() => {
    async function load() {
      await Promise.all([
        loadProject(),
        loadQuizzes(),
      ]);

      setLoading(false);
    }

    load();
  }, [
    loadProject,
    loadQuizzes,
  ]);

  function handleNameChange(
    value: string
  ) {
    setName(value);
    setSlug(slugify(value));
  }

  async function createQuiz(
    event: FormEvent
  ) {
    event.preventDefault();

    setCreating(true);
    setErrorMessage("");

    const { error } =
      await supabase
        .from("quizzes")
        .insert({
          project_id: projectId,
          name: name.trim(),
          slug: slug.trim(),
          is_published: true,
        });

    if (error) {
      if (error.code === "23505") {
        setErrorMessage(
          "This quiz URL already exists in this project."
        );
      } else {
        setErrorMessage(
          error.message
        );
      }

      setCreating(false);
      return;
    }

    setName("");
    setSlug("");

    await loadQuizzes();

    setCreating(false);
  }

  if (loading) {
    return (
      <main className="p-8">
        Loading...
      </main>
    );
  }

  if (!project) {
    return (
      <main className="p-8">
        Project not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/projects"
            )
          }
          className="mb-5 text-sm font-semibold text-gray-600"
        >
          ← Projects
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          {project.name}
        </h1>

        <p className="mt-2 text-gray-500">
          /{project.slug}
        </p>

        {/* CREATE QUIZ */}

        <form
          onSubmit={createQuiz}
          className="mt-8 rounded-2xl bg-white p-6 shadow"
        >

          <h2 className="text-xl font-bold text-gray-900">
            Create Quiz
          </h2>

          <div className="mt-5">

            <label className="block text-sm font-semibold text-gray-700">
              Quiz name
            </label>

            <input
              required
              type="text"
              value={name}
              onChange={(event) =>
                handleNameChange(
                  event.target.value
                )
              }
              placeholder="Istanbul Quiz"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900"
            />

          </div>

          <div className="mt-5">

            <label className="block text-sm font-semibold text-gray-700">
              Public URL
            </label>

            <div className="mt-1 rounded-lg border border-gray-300 px-3 py-3">

              <span className="text-gray-400">
                /{project.slug}/
              </span>

              <input
                value={slug}
                required
                onChange={(event) =>
                  setSlug(
                    slugify(
                      event.target.value
                    )
                  )
                }
                className="text-gray-900 outline-none"
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 rounded-lg bg-black px-5 py-3 font-semibold text-white disabled:bg-gray-400"
          >
            {creating
              ? "Creating..."
              : "Create quiz"}
          </button>

        </form>

        {/* QUIZZES */}

        <div className="mt-10 space-y-4">

          {quizzes.map(
            (quiz) => (

              <div
                key={quiz.id}
                className="rounded-2xl bg-white p-6 shadow"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      {quiz.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      /{project.slug}/{quiz.slug}
                    </p>

                  </div>

                  <Link
                    href={`/admin/projects/${projectId}/quizzes/${quiz.id}/questions`}
                    className="rounded-lg bg-black px-5 py-3 font-semibold text-white"
                  >
                    Questions
                  </Link>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </main>
  );
}