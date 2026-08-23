"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [checking, setChecking] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * If already logged in,
   * go directly to projects.
   */
  useEffect(() => {
    async function checkLogin() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        router.replace(
          "/admin/projects"
        );
        return;
      }

      setChecking(false);
    }

    checkLogin();
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error(
        "Login error:",
        error
      );

      setErrorMessage(
        error.message
      );

      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage(
        "Login failed."
      );

      setLoading(false);
      return;
    }

    router.replace(
      "/admin/projects"
    );

    router.refresh();
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">

      <div className="w-full max-w-md">

        <Link
          href="/"
          className="mb-6 inline-block font-semibold text-gray-600 hover:text-black"
        >
          ← Home
        </Link>

        <div className="rounded-3xl bg-white p-8 shadow">

          <div className="text-center">

            <h1 className="text-3xl font-bold text-gray-900">
              Log in
            </h1>

            <p className="mt-3 text-gray-600">
              Manage your projects and quizzes.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >

            <label className="block text-sm font-semibold text-gray-700">
              Email
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
            />

            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
            />

            {errorMessage && (
              <div className="mt-5 rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-black px-5 py-4 text-lg font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading
                ? "Logging in..."
                : "Log in"}
            </button>

          </form>

          <div className="mt-7 border-t border-gray-200 pt-6 text-center">

            <p className="text-gray-600">
              Don't have an account?
            </p>

            <Link
              href="/register"
              className="mt-2 inline-block font-bold text-gray-900 hover:underline"
            >
              Create account
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}