"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setAuthorized(false);
        setChecking(false);

        router.replace(
          "/admin-login"
        );

        return;
      }

      setAuthorized(true);
      setChecking(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session?.user) {
            setAuthorized(false);
            router.replace("/");
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Loading...
        </p>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">

          <Link
            href="/admin/projects"
            className="text-xl font-bold text-gray-900"
          >
            Quizly
          </Link>

          <div className="flex items-center gap-4">

            <Link
              href="/admin/projects"
              className="font-semibold text-gray-700 hover:text-black"
            >
              Projects
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      {children}
    </>
  );
}