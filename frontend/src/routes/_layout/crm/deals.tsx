// ============================================================
// frontend/src/routes/_layout/crm/deals.tsx
// ============================================================

import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Handshake, Search } from "lucide-react"
import { Suspense } from "react"
import { CrmDealsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddDeal from "@/components/CRM/Deals/AddDeal"
import { dealColumns } from "@/components/CRM/Deals/columns"
import PendingDeals from "@/components/Pending/PendingDeals"
import { useTenant } from "@/hooks/useTenant"

export function getDealsQueryOptions(tenantId: string) {
  return {
    queryFn: () => CrmDealsService.readDeals({ tenantId, skip: 0, limit: 100 }),
    queryKey: ["crm-deals", tenantId],
  }
}

export const Route = createFileRoute("/_layout/crm/deals")({
  component: CRMDeals,
  head: () => ({ meta: [{ title: "Deals - CRM" }] }),
})

function CRMDealsTableContent() {
  const { tenantId } = useTenant()
  const { data } = useSuspenseQuery(getDealsQueryOptions(tenantId))

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No deals yet</h3>
        <p className="text-muted-foreground">
          Create your first deal to start tracking revenue
        </p>
      </div>
    )
  }

  return <DataTable columns={dealColumns} data={data.data} />
}

function CRMDeals() {
  const { tenantId } = useTenant()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="h-6 w-6" />
            Deals
          </h1>
          <p className="text-muted-foreground">Track your sales pipeline</p>
        </div>
        <AddDeal tenantId={tenantId} />
      </div>
      <Suspense fallback={<PendingDeals />}>
        <CRMDealsTableContent />
      </Suspense>
    </div>
  )
}
