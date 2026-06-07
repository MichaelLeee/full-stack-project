// ============================================================
// frontend/src/routes/_layout/crm/notes.tsx
// Standalone notes route — shows all notes across entities
// ============================================================

import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FileText } from "lucide-react"
import { Suspense } from "react"
import { CrmNotesService } from "@/client"
import { useTenant } from "@/hooks/useTenant"

export function getNotesQueryOptions(tenantId: string) {
  return {
    queryFn: () => CrmNotesService.readNotes({ tenantId, skip: 0, limit: 100 }),
    queryKey: ["crm-notes-all", tenantId],
  }
}

export const Route = createFileRoute("/_layout/crm/notes")({
  component: CRMNotes,
  head: () => ({ meta: [{ title: "Notes - CRM" }] }),
})

function CRMNotesContent() {
  const { tenantId } = useTenant()
  const { data } = useSuspenseQuery(getNotesQueryOptions(tenantId))

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No notes yet</h3>
        <p className="text-muted-foreground">
          Notes appear here as you add them to companies, contacts, and deals.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {data.data.map((note) => (
        <div key={note.id} className="rounded-lg border p-4 bg-background">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {note.created_at && (
              <span>{new Date(note.created_at).toLocaleString()}</span>
            )}
            {note.company_id && (
              <span className="rounded bg-muted px-1.5 py-0.5">Company</span>
            )}
            {note.contact_id && (
              <span className="rounded bg-muted px-1.5 py-0.5">Contact</span>
            )}
            {note.deal_id && (
              <span className="rounded bg-muted px-1.5 py-0.5">Deal</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function CRMNotes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Notes
        </h1>
        <p className="text-muted-foreground">
          All notes across companies, contacts, and deals
        </p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CRMNotesContent />
      </Suspense>
    </div>
  )
}
