// ============================================================
// frontend/src/components/CRM/Contacts/columns.tsx
// ============================================================

import type { ColumnDef } from "@tanstack/react-table"
import { Mail, Phone } from "lucide-react"
import type { ContactPublic } from "@/client"
import { ContactActionsMenu } from "./ContactActionsMenu"

export const contactColumns: ColumnDef<ContactPublic>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const { first_name, last_name, title } = row.original
      return (
        <div>
          <p className="font-medium">
            {first_name} {last_name}
          </p>
          {title && <p className="text-xs text-muted-foreground">{title}</p>}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.original.email
      if (!email) return <span className="italic text-muted-foreground">—</span>
      return (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
        >
          <Mail className="size-3" />
          {email}
        </a>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.phone
      if (!phone) return <span className="italic text-muted-foreground">—</span>
      return (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-1.5 text-sm hover:underline"
        >
          <Phone className="size-3" />
          {phone}
        </a>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ContactActionsMenu contact={row.original} />
      </div>
    ),
  },
]
