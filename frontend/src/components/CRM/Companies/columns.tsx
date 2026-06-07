// ============================================================
// frontend/src/components/CRM/Companies/columns.tsx
// ============================================================

import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink } from "lucide-react"
import type { CRMCompanyPublic } from "@/client"
import { cn } from "@/lib/utils"
import { CRMCompanyActionsMenu } from "./CRMCompanyActionsMenu"

export const columns: ColumnDef<CRMCompanyPublic>[] = [
  {
    accessorKey: "name",
    header: "Company",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => (
      <span
        className={cn(!row.original.industry && "italic text-muted-foreground")}
      >
        {row.original.industry || "—"}
      </span>
    ),
  },
  {
    accessorKey: "city",
    header: "Location",
    cell: ({ row }) => {
      const { city, country } = row.original
      if (!city && !country)
        return <span className="italic text-muted-foreground">—</span>
      return (
        <span className="text-sm">
          {[city, country].filter(Boolean).join(", ")}
        </span>
      )
    },
  },
  {
    accessorKey: "employee_count",
    header: "Employees",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {row.original.employee_count?.toLocaleString() ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "annual_revenue",
    header: "Revenue",
    cell: ({ row }) => {
      const v = row.original.annual_revenue
      if (!v) return <span className="italic text-muted-foreground">—</span>
      return <span className="text-sm tabular-nums">${v.toLocaleString()}</span>
    },
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => {
      const url = row.original.website
      if (!url) return <span className="italic text-muted-foreground">—</span>
      return (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:underline text-sm"
        >
          {url.replace(/^https?:\/\//, "").split("/")[0]}
          <ExternalLink className="size-3" />
        </a>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <CRMCompanyActionsMenu company={row.original} />
      </div>
    ),
  },
]
