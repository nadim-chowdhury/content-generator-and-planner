"use client";

import { useState } from "react";
import { exportImportApi } from "@/lib/export-import";
import { useAuthStore } from "@/store/auth-store";
import Navbar from "@/components/Navbar";

export default function ExportImportPage() {
  const { user } = useAuthStore();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleExport = async (
    type: string,
    format: "json" | "csv" = "json"
  ) => {
    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case "ideas":
          if (format === "csv") {
            blob = await exportImportApi.exportIdeasCSV();
            filename = `ideas-export-${Date.now()}.csv`;
          } else {
            blob = await exportImportApi.exportIdeasJSON();
            filename = `ideas-export-${Date.now()}.json`;
          }
          break;
        case "planner":
          blob = await exportImportApi.exportPlanner();
          filename = `planner-export-${Date.now()}.json`;
          break;
        case "calendar":
          blob = await exportImportApi.exportCalendar();
          filename = `calendar-export-${Date.now()}.json`;
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(
        "Export failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleImport = async () => {
    if (!file) {
      setImportError("Please select a file");
      return;
    }

    setImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await exportImportApi.importIdeas(text);
      setImportResult(result);
    } catch (error: any) {
      setImportError(error.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Export & Import Data
        </h1>

        <div className="space-y-8">
          {/* Export Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Export Data
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Ideas
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport("ideas", "json")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport("ideas", "csv")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Planner
                </h3>
                <button
                  onClick={() => handleExport("planner")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Export Planner (JSON)
                </button>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Calendar
                </h3>
                <button
                  onClick={() => handleExport("calendar")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Export Calendar (JSON)
                </button>
              </div>

              {user?.plan === "AGENCY" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Export Workspace
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Export workspace data from team settings page
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Import Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Import Ideas from CSV
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Import ideas from a CSV file (e.g., exported from Notion or Google
              Sheets). The CSV should include columns: Title, Platform, Niche,
              and optionally Description, Hashtags, etc.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button
                onClick={handleImport}
                disabled={importing || !file}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? "Importing..." : "Import Ideas"}
              </button>

              {importError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded">
                  <p className="font-semibold">Import Complete!</p>
                  <p className="text-sm mt-1">
                    Successfully imported {importResult.imported} ideas
                    {importResult.errors > 0 &&
                      `, ${importResult.errors} errors`}
                  </p>
                  {importResult.errors > 0 && (
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer">View Errors</summary>
                      <ul className="mt-2 list-disc list-inside">
                        {importResult.details.errors.map(
                          (error: any, idx: number) => (
                            <li key={idx}>
                              Row {error.row}: {error.error}
                            </li>
                          )
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
