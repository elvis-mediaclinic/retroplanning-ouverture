"use client";

import { useState } from "react";

export function DateInput({ name, defaultValue, className }: { name: string; defaultValue?: string; className?: string }) {
  const [empty, setEmpty] = useState(!defaultValue);

  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={(e) => setEmpty(!e.target.value)}
      className={className}
      style={empty ? { borderStyle: "dashed", opacity: 0.5 } : undefined}
    />
  );
}
