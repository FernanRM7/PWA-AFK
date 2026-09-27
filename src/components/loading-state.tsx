"use client";

import { Button } from "@/components/ui/button";

type LoadingStateProps = {
  kind: "loading" | "error";
  title: string;
  description: string;
  onRetry?: () => void;
};

export function LoadingState({ kind, title, description, onRetry }: LoadingStateProps) {
  const isLoading = kind === "loading";

  return (
    <section
      aria-busy={isLoading}
      aria-labelledby="inspection-state-title"
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center"
      role={isLoading ? "status" : "alert"}
    >
      {isLoading && (
        <span aria-hidden="true" className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary motion-reduce:animate-none" />
      )}
      <div>
        <h2 className="font-semibold" id="inspection-state-title">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {!isLoading && onRetry && (
        <Button onClick={onRetry} type="button" variant="outline">Reintentar</Button>
      )}
    </section>
  );
}
