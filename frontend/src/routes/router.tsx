import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "components/layout/AppShell";

const HomePage = lazy(() => import("pages/HomePage"));
const PredictPage = lazy(() => import("pages/PredictPage"));
const HistoryPage = lazy(() => import("pages/HistoryPage"));
const AboutPage = lazy(() => import("pages/AboutPage"));
const ContactPage = lazy(() => import("pages/ContactPage"));
const NotFoundPage = lazy(() => import("pages/NotFoundPage"));

function RouteFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-6 py-20 text-center">
      <div className="space-y-4">
        <p className="font-display text-5xl uppercase tracking-[0.2em] text-boundary">Loading the scoreboard</p>
        <p className="mx-auto max-w-xl text-base text-ink/70">
          Pulling format metadata, previous session picks, and the current match canvas.
        </p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "predict/:format?",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <PredictPage />
          </Suspense>
        ),
      },
      {
        path: "history",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <HistoryPage />
          </Suspense>
        ),
      },
      {
        path: "about",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <AboutPage />
          </Suspense>
        ),
      },
      {
        path: "contact",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
