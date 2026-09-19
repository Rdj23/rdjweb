import React from "react";
import Button from "../components/ui/Button";
import { EmptyState } from "../components/ui/States";
import { IconFilm } from "../components/ui/Icons";

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={IconFilm}
      title="This page doesn't exist"
      description="The link may be out of date, or the title has left the catalog."
      action={
        <div className="flex gap-3 pt-1">
          <Button to="/">Back to home</Button>
          <Button to="/movies" variant="secondary">
            Browse movies
          </Button>
        </div>
      }
    />
  );
}
