import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type PropsWithChildren, type ReactElement, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

interface QueryBoundaryProps {
  pendingFallback: ReactElement;
  errorFallback: (props: FallbackProps) => ReactElement;
}

export function QueryBoundary({
  pendingFallback,
  errorFallback,
  children,
}: PropsWithChildren<QueryBoundaryProps>) {
  return (
    <QueryErrorResetBoundary>
      {({ reset: handleReset }) => (
        <ErrorBoundary onReset={handleReset} fallbackRender={errorFallback}>
          <Suspense fallback={pendingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
