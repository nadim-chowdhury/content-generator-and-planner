"use client";

import { useState, useEffect } from "react";
import { authApi } from "@/lib/auth";

interface TwoFactorSetupProps {
  onComplete: () => void;
}

export default function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    try {
      const { secret, qrCodeUrl } = await authApi.setup2FA();
      setSecret(secret);
      setQrCodeUrl(qrCodeUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to setup 2FA");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.enable2FA(token);
      onComplete();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid token. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "setup") {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Set up Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </p>
        </div>

        {qrCodeUrl && (
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          </div>
        )}

        {secret && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Manual entry code:
            </p>
            <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
              {secret}
            </code>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-3 rounded text-sm">
          <p className="font-medium mb-1">Next steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open your authenticator app</li>
            <li>Scan the QR code or enter the manual code</li>
            <li>Enter the 6-digit code from your app to verify</li>
          </ol>
        </div>

        <button
          onClick={() => setStep("verify")}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          I've scanned the code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="2fa-token"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Enter 6-digit code from your authenticator app
        </label>
        <input
          id="2fa-token"
          type="text"
          maxLength={6}
          required
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
          placeholder="000000"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep("setup")}
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || token.length !== 6}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify & Enable"}
        </button>
      </div>
    </form>
  );
}
