import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/api/http";
import { Button } from "@/components/ui/button";

type GoogleIdentity = {
  initialize: (options: {
    client_id: string;
    nonce: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (container: HTMLElement, options: {
    theme: "outline";
    size: "large";
    text: "continue_with";
    shape: "pill";
    logo_alignment: "center";
    locale: "en";
    width: number;
  }) => void;
};

const scriptUrl = "https://accounts.google.com/gsi/client";
let scriptLoad: Promise<GoogleIdentity> | undefined;

function identityClient() {
  return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
}

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const existingClient = identityClient();
  if (existingClient) return Promise.resolve(existingClient);
  if (scriptLoad) return scriptLoad;

  scriptLoad = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = scriptUrl;
    const fail = () => {
      script.remove();
      reject(new Error("Google sign-in could not load."));
    };
    const timer = window.setTimeout(fail, 10000);
    script.onload = () => {
      window.clearTimeout(timer);
      const client = identityClient();
      if (client) resolve(client);
      else fail();
    };
    script.onerror = () => { window.clearTimeout(timer); fail(); };
    document.head.append(script);
  }).catch(error => {
    scriptLoad = undefined;
    throw error;
  });
  return scriptLoad;
}

export function GoogleSignIn({ onCredential, loading }: {
  onCredential: (credential: string) => void;
  loading?: boolean;
}) {
  const button = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [buttonState, setButtonState] = useState<"preparing" | "ready" | "failed">("preparing");
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { callback.current = onCredential; }, [onCredential]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | undefined;
    let frameObserver: MutationObserver | undefined;
    let frame: HTMLIFrameElement | null = null;
    const controller = new AbortController();
    const container = button.current;
    setButtonState("preparing");
    const markReady = () => {
      if (!controller.signal.aborted) {
        window.clearTimeout(timeout);
        setButtonState("ready");
      }
    };
    const timeout = window.setTimeout(() => {
      controller.abort();
      setButtonState("failed");
    }, 15000);
    Promise.all([
      apiRequest<{ clientId: string; nonce: string }>("/auth/google", { signal: controller.signal }),
      loadGoogleIdentity(),
    ])
      .then(([challenge, google]) => {
        if (controller.signal.aborted || !container) return;
        google.initialize({
          client_id: challenge.clientId,
          nonce: challenge.nonce,
          callback: ({ credential }) => {
            if (credential && !controller.signal.aborted) callback.current(credential);
          },
        });
        let renderedWidth = 0;
        const renderButton = () => {
          const width = Math.min(400, container.clientWidth);
          if (width <= 0 || width === renderedWidth) return;
          renderedWidth = width;
          container.replaceChildren();
          google.renderButton(container, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            logo_alignment: "center",
            locale: "en",
            width,
          });
        };
        frameObserver = new MutationObserver(() => {
          const nextFrame = container.querySelector("iframe");
          if (!nextFrame || nextFrame === frame) return;
          frame?.removeEventListener("load", markReady);
          frame = nextFrame;
          frame.addEventListener("load", markReady, { once: true });
        });
        frameObserver.observe(container, { childList: true, subtree: true });
        renderButton();
        resizeObserver = new ResizeObserver(renderButton);
        resizeObserver.observe(container);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          window.clearTimeout(timeout);
          setButtonState("failed");
        }
      });
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      frameObserver?.disconnect();
      resizeObserver?.disconnect();
      frame?.removeEventListener("load", markReady);
      container?.replaceChildren();
    };
  }, [attempt]);

  const ready = buttonState === "ready";
  const connecting = requested && buttonState === "preparing";

  return <div className="grid gap-2 text-center text-sm" aria-busy={loading || connecting}>
    <div className="relative flex h-12 items-start justify-center">
      {!ready && <Button
        type="button"
        variant="outline"
        disabled={loading || connecting}
        className="absolute inset-0 h-12 w-full rounded-xl border-ink/15 bg-white font-semibold text-ink"
        onClick={() => {
          setRequested(true);
          if (buttonState === "failed") setAttempt(current => current + 1);
        }}
      >
        <span className="mr-2 grid size-5 place-items-center rounded-full border border-ink/15 text-xs font-bold" aria-hidden="true">G</span>
        {connecting ? "Connecting…" : buttonState === "failed" ? "Retry Google sign-in" : "Continue with Google"}
      </Button>}
      <div
        ref={button}
        className={`flex w-5/6 max-w-[400px] origin-top scale-[1.2] justify-center ${!ready ? "pointer-events-none opacity-0" : loading ? "pointer-events-none opacity-50" : ""}`}
        inert={!ready || loading}
      />
    </div>
    {loading && <p role="status">Signing in with Google…</p>}
    {!loading && ready && requested && <p role="status">Google is ready. Select Continue with Google to sign in.</p>}
  </div>;
}
