"use client";

import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { DotmSquare7 } from "@/components/ui/dotm-square-7";
import { DotmSquare10 } from "@/components/ui/dotm-square-10";
import { DotmSquare13 } from "@/components/ui/dotm-square-13";
import { useShellState, type ShellState } from "@/components/app-shell";
import type { DotMatrixCommonProps } from "@/lib/dotmatrix-core";

type StateCardContent = {
  title: string;
  color: string;
  Loader: ComponentType<DotMatrixCommonProps>;
};

const stateContent: Record<Exclude<ShellState, "success">, StateCardContent> = {
  loading: { title: "Cargando", color: "#34d399", Loader: DotmSquare10 },
  error: { title: "Error", color: "#dc2626", Loader: DotmSquare7 },
  empty: { title: "Vacío", color: "#ca8a04", Loader: DotmSquare13 },
};

export function TopbarStateCard() {
  const { state } = useShellState();

  if (state === "success") {
    return null;
  }

  const content = stateContent[state];
  const Loader = content.Loader;

  return (
    <Card
      aria-label={`Estado de la vista: ${content.title}`}
      className="hidden h-10 flex-row items-center gap-2 rounded-xl px-2.5 py-1.5 shadow-none ring-border sm:flex"
      role="status"
    >
      <Loader
        ariaLabel={`Estado ${content.title}`}
        color={content.color}
        dotSize={3}
        size={22}
      />
      <span className="text-xs font-medium text-foreground">{content.title}</span>
    </Card>
  );
}
