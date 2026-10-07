import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type PropsWithChildren, type ReactElement, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface QueryBoundaryProps {
  pendingFallback: ReactElement;
  errorFallback: ReactElement;
}

export function QueryBoundary({
  pendingFallback,
  errorFallback,
  children,
}: PropsWithChildren<QueryBoundaryProps>) {
  return (
    <QueryErrorResetBoundary>
      {({ reset: handleReset }) => (
        <ErrorBoundary onReset={handleReset} fallback={errorFallback}>
          <Suspense fallback={pendingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
