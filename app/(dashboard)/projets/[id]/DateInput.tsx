"use client";

import { useState } from "react";

export function DateInput({
  name,
  defaultValue,
  className,
  onChange,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
  onChange?: () => void;
}) {
  const [empty, setEmpty] = useState(!defaultValue);

  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue ?? ""}
      onChange={(e) => {
        setEmpty(!e.target.value);
        onChange?.();
      }}
      className={className}
      style={empty ? { borderStyle: "dashed", opacity: 0.5 } : undefined}
    />
  );
}
