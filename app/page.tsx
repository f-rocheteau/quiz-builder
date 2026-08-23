"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
export default function HomePage() {
  const router = useRouter();

  const [checking, setChecking] =
    useState(true);

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

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">

      {/* NAVIGATION */}

      <header className="border-b border-gray-200">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">

          <Link
            href="/"
            className="text-xl font-bold text-gray-900"
          >
            Quizly
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/admin-login"
              className="rounded-xl px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-black px-5 py-2 font-semibold text-white hover:bg-gray-800"
            >
              Create quiz
            </Link>

          </div>

        </div>

      </header>


      {/* HERO */}

      <section className="px-5 py-24">

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            Interactive quizzes for your event
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-tight text-gray-900 md:text-7xl">
            Create a quiz your guests will remember.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-gray-600">
            Create multilingual quizzes for weddings,
            birthdays, parties and events. Share one link
            and let everyone play from their phone.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/register"
              className="rounded-xl bg-black px-8 py-4 text-lg font-semibold text-white hover:bg-gray-800"
            >
              Create your quiz
            </Link>

            <Link
              href="/admin-login"
              className="rounded-xl border border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-900 hover:bg-gray-50"
            >
              Log in
            </Link>

          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section className="bg-gray-50 px-5 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <h2 className="text-4xl font-bold text-gray-900">
              From idea to quiz in minutes
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Create it, share it and let your guests play.
            </p>

          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-8 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
                1
              </div>

              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                Create
              </h3>

              <p className="mt-3 leading-relaxed text-gray-600">
                Create your project and add as many quizzes
                as you want.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
                2
              </div>

              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                Share
              </h3>

              <p className="mt-3 leading-relaxed text-gray-600">
                Send your unique quiz link or turn it into
                a QR code for your guests.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
                3
              </div>

              <h3 className="mt-6 text-2xl font-bold text-gray-900">
                Play
              </h3>

              <p className="mt-3 leading-relaxed text-gray-600">
                Guests answer from their own phones and
                compete on the leaderboard.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section className="px-5 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="grid items-center gap-12 md:grid-cols-2">

            <div>

              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Built for international events
              </p>

              <h2 className="mt-4 text-4xl font-bold text-gray-900">
                Everyone plays in their own language.
              </h2>

              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                Create every question in German, English,
                French and Turkish and let each guest choose
                their preferred language before starting.
              </p>

            </div>

            <div className="rounded-3xl bg-gray-100 p-8">

              <div className="grid grid-cols-2 gap-4">

                {[
                  "Deutsch",
                  "English",
                  "Français",
                  "Türkçe",
                ].map(
                  (language) => (

                    <div
                      key={language}
                      className="rounded-2xl bg-white p-6 text-center text-lg font-bold text-gray-900 shadow-sm"
                    >
                      {language}
                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* EXAMPLE URL */}

      <section className="bg-gray-900 px-5 py-20 text-white">

        <div className="mx-auto max-w-4xl text-center">

          <h2 className="text-4xl font-bold">
            One link. Every guest.
          </h2>

          <p className="mt-5 text-lg text-gray-300">
            Your quiz gets its own shareable URL.
          </p>

          <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white/10 px-6 py-5 font-mono text-sm sm:text-lg">
            yoursite.com/dilara-fabien-wedding/couple-quizz
          </div>

        </div>

      </section>


      {/* FINAL CTA */}

      <section className="px-5 py-24">

        <div className="mx-auto max-w-3xl text-center">

          <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
            Ready to create your quiz?
          </h2>

          <p className="mt-5 text-lg text-gray-600">
            Create an account and start adding your questions.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-black px-8 py-4 text-lg font-semibold text-white hover:bg-gray-800"
          >
            Get started
          </Link>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="border-t border-gray-200 px-5 py-8">

        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-gray-500">

          <span>
            Quizly
          </span>

          <Link
            href="/admin-login"
            className="hover:text-black"
          >
            Log in
          </Link>

        </div>

      </footer>

    </main>
  );
}