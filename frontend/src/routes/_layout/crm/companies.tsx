// frontend/src/routes/_layout/crm/companies.tsx  (new file)
// Create the folder: src/routes/_layout/crm/

import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Building2, Search } from "lucide-react"
import { Suspense } from "react"

import { CrmCompaniesService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddCRMCompany from "@/components/CRM/Companies/AddCRMCompany"
import { columns } from "@/components/CRM/Companies/columns"
import PendingCRMCompanies from "@/components/Pending/PendingCRMCompanies"
import { useTenant } from "@/hooks/useTenant"

export function getCRMCompaniesQueryOptions(tenantId: string) {
  return {
    queryFn: () =>
      CrmCompaniesService.readCompanies({ tenantId, skip: 0, limit: 100 }),
    queryKey: ["crm-companies", tenantId],
  }
}

export const Route = createFileRoute("/_layout/crm/companies")({
  component: CRMCompanies,
  head: () => ({ meta: [{ title: "Companies - CRM" }] }),
})

function CRMCompaniesTableContent() {
  const { tenantId } = useTenant()
  const { data } = useSuspenseQuery(getCRMCompaniesQueryOptions(tenantId))

  if (data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No companies yet</h3>
        <p className="text-muted-foreground">
          Add the first company to get started
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={data.data} />
}

function CRMCompanies() {
  const { tenantId } = useTenant()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Companies
          </h1>
          <p className="text-muted-foreground">Organizations and accounts</p>
        </div>
        <AddCRMCompany tenantId={tenantId} />
      </div>
      <Suspense fallback={<PendingCRMCompanies />}>
        <CRMCompaniesTableContent />
      </Suspense>
    </div>
  )
}
