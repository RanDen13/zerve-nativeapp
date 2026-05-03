import { AlertTriangle, RefreshCw, Wifi } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const KIOSK_URL = "https://reservation.safehub-lcup.uk/calendar?kiosk=true";

type AppState = "checking" | "loading" | "ready" | "error";

export function App() {
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const [appState, setAppState] = useState<AppState>("checking");
  const [errorMessage, setErrorMessage] = useState(
    "Checking kiosk availability.",
  );

  const dismissLoadingOverlay = useCallback(() => {
    if (appState === "loading") {
      setAppState("ready");
    }
  }, [appState]);

  const checkKioskAvailability = useCallback(async () => {
    setAppState("checking");
    setErrorMessage("Checking kiosk availability.");

    if (!window.kioskApi?.checkHealth) {
      setErrorMessage(
        "Secure preload API is unavailable. Restart the app and try again.",
      );
      setAppState("error");
      return;
    }

    const health = await window.kioskApi.checkHealth();

    if (!health.ok) {
      setErrorMessage(
        health.reason ??
          "The kiosk health check endpoint did not return OK. Please verify network access.",
      );
      setAppState("error");
      return;
    }

    setAppState("loading");
  }, []);

  useEffect(() => {
    void checkKioskAvailability();
  }, [checkKioskAvailability]);

  useEffect(() => {
    if (appState !== "loading" && appState !== "ready") {
      return;
    }

    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const handleLoadComplete = () => {
      setAppState("ready");
    };

    const handleLoadSettled = () => {
      if (!(webview as any).isLoading()) {
        setAppState("ready");
      }
    };

    const handleLoadFailed = (event: Event) => {
      const webviewEvent = event as Electron.DidFailLoadEvent;

      if (webviewEvent.isMainFrame) {
        setErrorMessage(
          webviewEvent.errorDescription ||
            "Unable to load the kiosk calendar. Please try again.",
        );
        setAppState("error");
      }
    };

    webview.addEventListener("did-finish-load", handleLoadComplete);
    webview.addEventListener("did-stop-loading", handleLoadSettled);
    webview.addEventListener("dom-ready", handleLoadSettled);
    webview.addEventListener("did-fail-load", handleLoadFailed);

    queueMicrotask(handleLoadSettled);

    const handleCrashed = () => {
      setErrorMessage("Kiosk webview crashed. Returning to error screen.");
      setAppState("error");
    };

    webview.addEventListener("crashed", handleCrashed as EventListener);
    webview.addEventListener("destroyed", handleCrashed as EventListener);

    return () => {
      webview.removeEventListener("did-finish-load", handleLoadComplete);
      webview.removeEventListener("did-stop-loading", handleLoadSettled);
      webview.removeEventListener("dom-ready", handleLoadSettled);
      webview.removeEventListener("did-fail-load", handleLoadFailed);
      webview.removeEventListener("crashed", handleCrashed as EventListener);
      webview.removeEventListener("destroyed", handleCrashed as EventListener);
    };
  }, [appState]);

  // Periodic runtime health polling while kiosk is visible; if health fails, fall back to error screen
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null;

    async function checkNow() {
      try {
        const health = await window.kioskApi.checkHealth();
        if (!health.ok) {
          setErrorMessage(
            health.reason ?? `Health check failed (status ${health.status})`,
          );
          setAppState("error");
          // remove webview content
          if (webviewRef.current) {
            try {
              webviewRef.current.setAttribute("src", "about:blank");
            } catch {}
          }
        }
      } catch (e) {
        setErrorMessage("Runtime health check failed.");
        setAppState("error");
        if (webviewRef.current) {
          try {
            webviewRef.current.setAttribute("src", "about:blank");
          } catch {}
        }
      }
    }

    if (appState === "loading" || appState === "ready") {
      // run an immediate check and then poll every 15 seconds
      void checkNow();
      iv = setInterval(() => void checkNow(), 15000);
    }

    return () => {
      if (iv) clearInterval(iv);
    };
  }, [appState]);

  const statusText = useMemo(() => {
    if (appState === "checking") {
      return "Pinging health endpoint";
    }

    if (appState === "loading") {
      return "Opening reservation calendar";
    }

    return "Online";
  }, [appState]);

  const showKiosk = appState === "loading" || appState === "ready";

  return (
    <main className="kiosk-shell min-h-screen w-screen h-screen overflow-hidden">
      {showKiosk ? (
        <section className="absolute inset-0 overflow-hidden bg-card/70">
          <webview
            ref={(node) => {
              webviewRef.current = node;
            }}
            src={KIOSK_URL}
            className="h-full w-full"
            partition="persist:kiosk"
            allowpopups={false}
          />

          {appState === "loading" && (
            <div
              className="kiosk-overlay absolute inset-0 z-10 flex items-center justify-center p-4"
              onClick={dismissLoadingOverlay}
              onPointerDown={dismissLoadingOverlay}
            >
              <Card
                className="w-full max-w-xl border-border/70 bg-card/95 shadow-2xl"
                onClick={dismissLoadingOverlay}
              >
                <CardHeader className="space-y-4">
                  <Badge className="w-fit" variant="secondary">
                    Connecting
                  </Badge>
                  <CardTitle className="text-2xl tracking-tight">
                    Preparing kiosk view
                  </CardTitle>
                  <CardDescription>
                    Securely connecting to Safehub reservation services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[85%]" />
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Wifi className="h-4 w-4 animate-pulse" />
                    {statusText}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      ) : (
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-2xl items-center md:min-h-[calc(100vh-4rem)]">
          <Card className="w-full border-border/70 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur-sm">
            <CardHeader className="space-y-4">
              <Badge
                className="w-fit"
                variant={appState === "error" ? "destructive" : "secondary"}
              >
                {appState === "checking" ? "Health Check" : "Connection Error"}
              </Badge>
              <CardTitle className="text-3xl tracking-tight">
                {appState === "checking"
                  ? "Initializing kiosk"
                  : "Unable to reach reservation page"}
              </CardTitle>
              <CardDescription className="text-base">
                {appState === "checking"
                  ? "Verifying https://reservation.safehub-lcup.uk/api/health"
                  : errorMessage}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {appState === "checking" ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-[72%]" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[83%]" />
                </div>
              ) : (
                <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Health check failed or remote page could not be loaded.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Ensure the network allows access to
                    reservation.safehub-lcup.uk and try again.
                  </p>
                </div>
              )}

              {appState === "error" && (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void checkKioskAvailability()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}
