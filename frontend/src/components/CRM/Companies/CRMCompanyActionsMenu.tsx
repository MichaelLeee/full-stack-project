// ============================================================
// frontend/src/components/CRM/Companies/CRMCompanyActionsMenu.tsx
// ============================================================

import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import type { CRMCompanyPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteCRMCompany from "./DeleteCRMCompany"
import EditCRMCompany from "./EditCRMCompany"

export function CRMCompanyActionsMenu({
  company,
}: {
  company: CRMCompanyPublic
}) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditCRMCompany company={company} onSuccess={() => setOpen(false)} />
        <DeleteCRMCompany id={company.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
