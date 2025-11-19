"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  const verifyEmail = async (token: string) => {
    try {
      setStatus("loading");
      await authApi.verifyEmail(token);
      setStatus("success");
      setMessage("Your email has been verified successfully!");
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
          "Failed to verify email. The link may have expired."
      );
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("Verification token is missing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          {status === "loading" && (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Email...
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting to login page...
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Go to Login
                </Link>
                <Link
                  href="/signup"
                  className="block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Sign Up Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
