// ============================================================
// frontend/src/components/CRM/Contacts/ContactActionsMenu.tsx
// ============================================================

import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import type { ContactPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteContact from "./DeleteContact"
import EditContact from "./EditContact"

export function ContactActionsMenu({ contact }: { contact: ContactPublic }) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditContact contact={contact} onSuccess={() => setOpen(false)} />
        <DeleteContact id={contact.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
