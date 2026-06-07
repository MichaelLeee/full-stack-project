// ============================================================
// frontend/src/routes/_layout/crm/contacts.tsx
// ============================================================

import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search, Users } from "lucide-react"
import { Suspense } from "react"
import { CrmContactsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddContact from "@/components/CRM/Contacts/AddContact"
import { contactColumns } from "@/components/CRM/Contacts/columns"
import { useTenant } from "@/hooks/useTenant"

export function getContactsQueryOptions(tenantId: string) {
  return {
    queryFn: () =>
      CrmContactsService.readContacts({ tenantId, skip: 0, limit: 100 }),
    queryKey: ["crm-contacts", tenantId],
  }
}

export const Route = createFileRoute("/_layout/crm/contacts")({
  component: CRMContacts,
  head: () => ({ meta: [{ title: "Contacts - CRM" }] }),
})

function CRMContactsTableContent() {
  const { tenantId } = useTenant()
  const { data } = useSuspenseQuery(getContactsQueryOptions(tenantId))

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No contacts yet</h3>
        <p className="text-muted-foreground">
          Add contacts from your companies
        </p>
      </div>
    )
  }

  return <DataTable columns={contactColumns} data={data.data} />
}

function CRMContacts() {
  const { tenantId } = useTenant()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Contacts
          </h1>
          <p className="text-muted-foreground">People inside your companies</p>
        </div>
        <AddContact tenantId={tenantId} />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CRMContactsTableContent />
      </Suspense>
    </div>
  )
}
