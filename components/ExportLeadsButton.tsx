"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function ExportLeadsButton({ estado }: { estado?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const url = `/api/leads/export${estado ? `?estado=${estado}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        alert("No leads to export");
        return;
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `leads${estado ? `-${estado}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Export error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
    >
      <Download className="w-4 h-4" />
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}