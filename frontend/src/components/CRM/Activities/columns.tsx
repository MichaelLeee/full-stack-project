// ============================================================
// frontend/src/components/CRM/Activities/columns.tsx
// ============================================================

import type { ColumnDef } from "@tanstack/react-table"
import { Calendar, CheckSquare, Mail, Phone } from "lucide-react"
import type { ActivityPublic } from "@/client"
import { cn } from "@/lib/utils"
import { ActivityActionsMenu } from "./ActivityActionsMenu"

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  meeting: <Calendar className="size-3.5" />,
  task: <CheckSquare className="size-3.5" />,
}

export const activityColumns: ColumnDef<ActivityPublic>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 capitalize text-sm">
        {TYPE_ICONS[row.original.type]}
        {row.original.type}
      </div>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-medium",
          row.original.completed && "line-through text-muted-foreground",
        )}
      >
        {row.original.subject}
      </span>
    ),
  },
  {
    accessorKey: "due_date",
    header: "Due",
    cell: ({ row }) => {
      const d = row.original.due_date
      if (!d) return <span className="italic text-muted-foreground">—</span>
      const date = new Date(d)
      const overdue = !row.original.completed && date < new Date()
      return (
        <span className={cn("text-sm", overdue && "text-red-500 font-medium")}>
          {date.toLocaleDateString()}
        </span>
      )
    },
  },
  {
    accessorKey: "completed",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          row.original.completed
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700",
        )}
      >
        {row.original.completed ? "Done" : "Pending"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ActivityActionsMenu activity={row.original} />
      </div>
    ),
  },
]
