"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
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

export default function ProjectsPage() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadProjects =
    useCallback(async () => {

      const { data, error } =
        await supabase
          .from("projects")
          .select(
            "id, name, slug, created_at"
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

      setProjects(
        (data ?? []) as Project[]
      );

    }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function handleNameChange(
    value: string
  ) {
    setName(value);

    /*
     * Automatically generate URL
     * while the user types.
     */
    setSlug(
      slugify(value)
    );
  }

  async function createProject(
    event: FormEvent
  ) {
    event.preventDefault();

    setCreating(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      setErrorMessage(
        "Not authenticated."
      );

      setCreating(false);
      return;
    }

    if (
      !name.trim() ||
      !slug.trim()
    ) {
      setErrorMessage(
        "Name and URL are required."
      );

      setCreating(false);
      return;
    }

    const { error } =
      await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          slug: slug.trim(),
        });

    if (error) {
      if (error.code === "23505") {
        setErrorMessage(
          "This project URL is already taken."
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

    await loadProjects();

    setCreating(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">

      <div className="mx-auto max-w-5xl">

        <h1 className="text-3xl font-bold text-gray-900">
          My Projects
        </h1>

        <p className="mt-2 text-gray-600">
          Create an event and add quizzes to it.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* CREATE PROJECT */}

        <form
          onSubmit={createProject}
          className="mt-8 rounded-2xl bg-white p-6 shadow"
        >

          <h2 className="text-xl font-bold text-gray-900">
            Create Project
          </h2>

          <div className="mt-5">

            <label className="block text-sm font-semibold text-gray-700">
              Project name
            </label>

            <input
              type="text"
              value={name}
              required
              onChange={(event) =>
                handleNameChange(
                  event.target.value
                )
              }
              placeholder="Fabien & Dilara Wedding"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900"
            />

          </div>

          <div className="mt-5">

            <label className="block text-sm font-semibold text-gray-700">
              Project URL
            </label>

            <div className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white">

              <span className="pl-3 text-gray-400">
                /
              </span>

              <input
                type="text"
                value={slug}
                required
                onChange={(event) =>
                  setSlug(
                    slugify(
                      event.target.value
                    )
                  )
                }
                placeholder="fabien-dilara-wedding"
                className="w-full px-2 py-3 text-gray-900 outline-none"
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
              : "Create project"}
          </button>

        </form>

        {/* PROJECTS */}

        <div className="mt-10 space-y-4">

          {projects.map(
            (project) => (

              <div
                key={project.id}
                className="flex items-center justify-between rounded-2xl bg-white p-6 shadow"
              >

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    {project.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    /{project.slug}
                  </p>

                </div>

                <Link
                  href={`/admin/projects/${project.id}`}
                  className="rounded-lg bg-black px-5 py-3 font-semibold text-white"
                >
                  Manage
                </Link>

              </div>

            )
          )}

          {projects.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500">
              No projects yet.
            </div>
          )}

        </div>

      </div>

    </main>
  );
}