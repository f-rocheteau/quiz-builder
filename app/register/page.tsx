"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /*
   * Already logged in?
   * Then go directly to projects.
   */
  useEffect(() => {
    async function checkLogin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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

    setErrorMessage("");
    setSuccessMessage("");

    if (
      password !==
      passwordConfirmation
    ) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Password must contain at least 8 characters."
      );

      return;
    }

    setLoading(true);

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email:
          email.trim(),
        password,
      });

    if (error) {
      setErrorMessage(
        error.message
      );

      setLoading(false);
      return;
    }

    /*
     * Email confirmation disabled:
     * Supabase immediately creates a session.
     */
    if (data.session) {
      router.replace(
        "/admin/projects"
      );

      return;
    }

    /*
     * Email confirmation enabled:
     * account exists, but user must
     * confirm the email first.
     */
    setSuccessMessage(
      "Account created. Please check your email and confirm your account."
    );

    setLoading(false);
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
              Create your account
            </h1>

            <p className="mt-3 text-gray-600">
              Create projects, quizzes and share them with your guests.
            </p>

          </div>

          {successMessage ? (

            <div className="mt-8">

              <div className="rounded-xl bg-green-100 p-5 text-green-800">

                <p className="font-semibold">
                  {successMessage}
                </p>

              </div>

              <Link
                href="/admin-login"
                className="mt-5 block w-full rounded-xl bg-black px-5 py-4 text-center font-semibold text-white"
              >
                Go to login
              </Link>

            </div>

          ) : (

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
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
              />

              <label className="mt-5 block text-sm font-semibold text-gray-700">
                Confirm password
              </label>

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={
                  passwordConfirmation
                }
                onChange={(event) =>
                  setPasswordConfirmation(
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
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>

          )}

          <div className="mt-7 border-t border-gray-200 pt-6 text-center">

            <p className="text-gray-600">
              Already have an account?
            </p>

            <Link
              href="/admin-login"
              className="mt-2 inline-block font-bold text-gray-900 hover:underline"
            >
              Log in
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}