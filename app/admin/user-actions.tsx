"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RANKS_LIST } from "@/lib/ranks";
import type { Rank } from "@/lib/types";

export function UserActions({
  userId,
  username,
  banned,
  currentRank,
}: { userId: number; username: string; banned: boolean; currentRank: Rank }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [showRank, setShowRank] = React.useState(false);

  async function call(path: string, method = "POST", body?: unknown) {
    setPending(true);
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showRank && (
        <select
          className="field-input"
          style={{ height: 30, padding: "0 8px", fontSize: 12, width: "auto" }}
          defaultValue={currentRank}
          onChange={(e) => {
            const v = e.target.value;
            call(`/api/admin/users/${userId}/rank`, "POST", { rank: v === "auto" ? null : v });
          }}
        >
          <option value="auto">auto (clear override)</option>
          {RANKS_LIST.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}
      <button onClick={() => setShowRank((v) => !v)} className="btn btn-ghost" style={{ height: 30, padding: "0 10px", fontSize: 12 }}>
        Set rank
      </button>
      {banned ? (
        <button
          disabled={pending}
          onClick={() => call(`/api/admin/users/${userId}/unban`, "POST")}
          className="btn btn-ghost"
          style={{ height: 30, padding: "0 10px", fontSize: 12 }}
        >
          Unban
        </button>
      ) : (
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(`Ban @${username}?`)) return;
            call(`/api/admin/users/${userId}/ban`, "POST");
          }}
          className="btn btn-ghost"
          style={{ height: 30, padding: "0 10px", fontSize: 12, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
        >
          Ban
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete account @${username}? Their content stays but is anonymised.`)) return;
          call(`/api/admin/users/${userId}/destroy`, "DELETE");
        }}
        className="btn btn-ghost"
        style={{ height: 30, padding: "0 10px", fontSize: 12, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
      >
        Delete
      </button>
    </div>
  );
}
