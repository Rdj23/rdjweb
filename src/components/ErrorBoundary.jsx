import React from "react";
import Button from "./ui/Button";

/** Keeps one broken page from blanking the whole app. */
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-white">This page hit a snag</h1>
        <p className="text-sm text-ink-400">
          {this.state.error?.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.assign("/")}>Back to home</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }
}
