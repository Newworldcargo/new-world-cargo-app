import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/api/http";

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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { callback.current = onCredential; }, [onCredential]);

  useEffect(() => {
    let observer: ResizeObserver | undefined;
    const controller = new AbortController();
    const container = button.current;
    setFailed(false);
    apiRequest<{ clientId: string; nonce: string }>("/auth/google", { signal: controller.signal })
      .then(async challenge => ({ challenge, google: await loadGoogleIdentity() }))
      .then(({ challenge, google }) => {
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
        renderButton();
        observer = new ResizeObserver(renderButton);
        observer.observe(container);
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => { controller.abort(); observer?.disconnect(); container?.replaceChildren(); };
  }, [attempt]);

  return <div className="grid gap-2 text-center text-sm" aria-busy={loading}>
    <div className="flex h-12 items-start justify-center">
      <div
        ref={button}
        className={`flex w-5/6 max-w-[400px] origin-top scale-[1.2] justify-center ${loading ? "pointer-events-none opacity-50" : ""}`}
        inert={loading}
      />
    </div>
    {loading && <p role="status">Signing in with Google…</p>}
    {failed && <button type="button" className="min-h-11 underline" onClick={() => setAttempt(current => current + 1)}>Retry Google sign-in</button>}
  </div>;
}
