// ============================================================
// frontend/src/routes/_layout/crm/activities.tsx
// ============================================================

import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CalendarClock, Search } from "lucide-react"
import { CrmActivitiesService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddActivity from "@/components/CRM/Activities/AddActivity"
import { activityColumns } from "@/components/CRM/Activities/columns"
import { useTenant } from "@/hooks/useTenant"

export function getActivitiesQueryOptions(tenantId: string) {
  return {
    queryFn: () =>
      CrmActivitiesService.readActivities({ tenantId, skip: 0, limit: 100 }),
    queryKey: ["crm-activities", tenantId],
  }
}

export const Route = createFileRoute("/_layout/crm/activities")({
  component: CRMActivities,
  head: () => ({ meta: [{ title: "Activities - CRM" }] }),
})

function CRMActivities() {
  const { tenantId } = useTenant()
  const { data } = useSuspenseQuery(getActivitiesQueryOptions(tenantId))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6" />
            Activities
          </h1>
          <p className="text-muted-foreground">
            Calls, emails, meetings, and tasks
          </p>
        </div>
        <AddActivity tenantId={tenantId} />
      </div>
      {data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No activities yet</h3>
        </div>
      ) : (
        <DataTable columns={activityColumns} data={data.data} />
      )}
    </div>
  )
}
