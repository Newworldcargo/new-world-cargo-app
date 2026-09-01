import { cn } from "@/lib/utils";
import { feedback } from "@/lib/feedback";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadFailure(error: Error) {
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .* failed/i.test(
    error.message
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (isChunkLoadFailure(error)) {
      // A deployed release may remove a hashed lazy-load file held by an old tab.
      // Reload the current route; AuthProvider will retain a valid server session.
      window.location.reload();
      return;
    }
    feedback.fromError(error, "We couldn't open this page");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">We couldn't open this page.</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Please reload and sign in again if your session has ended.
            </p>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
