// ============================================================
// frontend/src/components/CRM/Notes/NotesList.tsx
// Notes are displayed inline on company/contact/deal detail pages,
// not as a standalone table. This is the reusable notes panel.
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Send, Trash2 } from "lucide-react"
import { useState } from "react"
import { CrmNotesService } from "@/client"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { useTenant } from "@/hooks/useTenant"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

interface NotesListProps {
  companyId?: string
  contactId?: string
  dealId?: string
}

export function NotesList({ companyId, contactId, dealId }: NotesListProps) {
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [draft, setDraft] = useState("")

  // Build a stable query key from the entity context
  const queryKey = ["crm-notes", tenantId, companyId, contactId, dealId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      CrmNotesService.readNotes({
        tenantId,
        companyId,
        contactId,
        dealId,
        skip: 0,
        limit: 100,
      }),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      CrmNotesService.createNote({
        tenantId,
        requestBody: {
          content: draft.trim(),
          company_id: companyId,
          contact_id: contactId,
          deal_id: dealId,
        },
      }),
    onSuccess: () => {
      setDraft("")
      queryClient.invalidateQueries({ queryKey })
    },
    onError: handleError.bind(showErrorToast),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CrmNotesService.deleteNote({ id, tenantId }),
    onSuccess: () => {
      showSuccessToast("Note deleted")
      queryClient.invalidateQueries({ queryKey })
    },
    onError: handleError.bind(showErrorToast),
  })

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Notes</h3>

      {/* Existing notes */}
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        )}
        {data?.data.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground italic">No notes yet.</p>
        )}
        {data?.data.map((note) => (
          <div
            key={note.id}
            className="group relative rounded-md border bg-muted/40 p-3 text-sm"
          >
            <p className="whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {note.created_at
                  ? new Date(note.created_at).toLocaleString()
                  : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(note.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="size-3" />
                <span className="sr-only">Delete note</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* New note input */}
      <div className="flex gap-2 items-end">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl + Enter submits
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              if (draft.trim()) createMutation.mutate()
            }
          }}
          placeholder="Add a note… (⌘Enter to save)"
          rows={2}
          className={cn(
            "flex-1 resize-none rounded-md border border-input bg-background",
            "px-3 py-2 text-sm placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
        />
        <LoadingButton
          size="icon"
          loading={createMutation.isPending}
          disabled={!draft.trim()}
          onClick={() => createMutation.mutate()}
          className="shrink-0"
        >
          <Send className="size-4" />
          <span className="sr-only">Save note</span>
        </LoadingButton>
      </div>
    </div>
  )
}
