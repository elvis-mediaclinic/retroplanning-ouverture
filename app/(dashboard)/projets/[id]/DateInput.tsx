"use client";

import { useState } from "react";

export function DateInput({ name, defaultValue, className }: { name: string; defaultValue?: string; className?: string }) {
  const [hasValue, setHasValue] = useState(!!defaultValue);

  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={(e) => setHasValue(!!e.target.value)}
      className={className}
      style={!hasValue ? { borderStyle: "dashed", color: "transparent" } : undefined}
      onFocus={(e) => (e.target.style.color = "")}
      onBlur={(e) => { if (!e.target.value) e.target.style.color = "transparent"; }}
    />
  );
}
