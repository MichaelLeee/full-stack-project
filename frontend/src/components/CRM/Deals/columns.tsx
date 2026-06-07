// ============================================================
// frontend/src/components/CRM/Deals/columns.tsx
// ============================================================

import type { ColumnDef } from "@tanstack/react-table"
import type { DealPublic } from "@/client"
import { cn } from "@/lib/utils"
import { DealActionsMenu } from "./DealActionsMenu"

const STAGE_LABELS: Record<string, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-gray-100 text-gray-700" },
  qualified: { label: "Qualified", className: "bg-blue-100 text-blue-700" },
  proposal: { label: "Proposal", className: "bg-purple-100 text-purple-700" },
  negotiation: {
    label: "Negotiation",
    className: "bg-amber-100 text-amber-700",
  },
  closed_won: { label: "Closed Won", className: "bg-green-100 text-green-700" },
  closed_lost: { label: "Closed Lost", className: "bg-red-100 text-red-700" },
}

export const dealColumns: ColumnDef<DealPublic>[] = [
  {
    accessorKey: "name",
    header: "Deal",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const s = STAGE_LABELS[row.original.stage] ?? {
        label: row.original.stage,
        className: "",
      }
      return (
        <span
          className={cn("px-2 py-0.5 rounded text-xs font-medium", s.className)}
        >
          {s.label}
        </span>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const v = row.original.amount
      if (!v) return <span className="italic text-muted-foreground">—</span>
      return (
        <span className="tabular-nums font-medium">${v.toLocaleString()}</span>
      )
    },
  },
  {
    accessorKey: "probability",
    header: "Probability",
    cell: ({ row }) => {
      const p = row.original.probability
      if (p == null)
        return <span className="italic text-muted-foreground">—</span>
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${p}%` }}
            />
          </div>
          <span className="text-sm tabular-nums">{p}%</span>
        </div>
      )
    },
  },
  {
    accessorKey: "expected_close_date",
    header: "Close Date",
    cell: ({ row }) => {
      const d = row.original.expected_close_date
      if (!d) return <span className="italic text-muted-foreground">—</span>
      return <span className="text-sm">{new Date(d).toLocaleDateString()}</span>
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DealActionsMenu deal={row.original} />
      </div>
    ),
  },
]
