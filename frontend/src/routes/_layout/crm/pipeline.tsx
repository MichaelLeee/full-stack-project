// ============================================================
// frontend/src/routes/_layout/crm/pipeline.tsx
// Pipeline dashboard — deal funnel view
// ============================================================

import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CrmDealsService } from "@/client"
import { useTenant } from "@/hooks/useTenant"

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-gray-100 border-gray-300" },
  { key: "qualified", label: "Qualified", color: "bg-blue-50 border-blue-300" },
  {
    key: "proposal",
    label: "Proposal",
    color: "bg-purple-50 border-purple-300",
  },
  {
    key: "negotiation",
    label: "Negotiation",
    color: "bg-amber-50 border-amber-300",
  },
  {
    key: "closed_won",
    label: "Closed Won",
    color: "bg-green-50 border-green-300",
  },
  {
    key: "closed_lost",
    label: "Closed Lost",
    color: "bg-red-50 border-red-300",
  },
]

export const Route = createFileRoute("/_layout/crm/pipeline")({
  component: Pipeline,
  head: () => ({ meta: [{ title: "Pipeline - CRM" }] }),
})

function Pipeline() {
  const { tenantId } = useTenant()
  const { data } = useSuspenseQuery({
    queryKey: ["crm-deals", tenantId],
    queryFn: () => CrmDealsService.readDeals({ tenantId, skip: 0, limit: 500 }),
  })

  const byStage = STAGES.map((stage) => ({
    ...stage,
    deals: data.data.filter((d) => d.stage === stage.key),
    total: data.data
      .filter((d) => d.stage === stage.key)
      .reduce((sum, d) => sum + (d.amount ?? 0), 0),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">Visual deal funnel</p>
      </div>

      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {byStage.map((stage) => (
          <div
            key={stage.key}
            className={`rounded-lg border p-3 ${stage.color}`}
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {stage.label}
            </p>
            <p className="text-2xl font-bold">{stage.deals.length}</p>
            <p className="text-xs text-muted-foreground">
              ${stage.total.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {byStage
          .filter((s) => s.deals.length > 0)
          .map((stage) => (
            <div key={stage.key} className="space-y-2">
              <h3 className="font-medium text-sm">
                {stage.label} ({stage.deals.length})
              </h3>
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-background border rounded-md p-3 text-sm"
                >
                  <p className="font-medium truncate">{deal.name}</p>
                  {deal.amount && (
                    <p className="text-muted-foreground text-xs mt-0.5">
                      ${deal.amount.toLocaleString()}
                    </p>
                  )}
                  {deal.probability != null && (
                    <div className="mt-1.5 h-1 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
