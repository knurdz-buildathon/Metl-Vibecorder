-- Extend check results with normalized metadata.
ALTER TABLE "check_runs"
  ADD COLUMN "duration_ms" INTEGER,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "artifacts" JSONB,
  ADD COLUMN "error" TEXT;

-- Persist local workspace/container metadata separately from legacy session fields.
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'local-docker',
    "container_id" TEXT,
    "root_path" TEXT NOT NULL,
    "repo_path" TEXT NOT NULL,
    "internal_path" TEXT NOT NULL,
    "ide_url" TEXT,
    "preview_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspaces_session_id_key" ON "workspaces"("session_id");

ALTER TABLE "workspaces"
  ADD CONSTRAINT "workspaces_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Persist SSE events so newly connected clients can replay recent session state.
CREATE TABLE "session_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "session_events_session_id_created_at_idx"
  ON "session_events"("session_id", "created_at");

ALTER TABLE "session_events"
  ADD CONSTRAINT "session_events_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "final_reports"
  ADD COLUMN "markdown" TEXT;
