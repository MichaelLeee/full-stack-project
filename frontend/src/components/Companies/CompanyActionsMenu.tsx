// frontend/src/components/Companies/CompanyActionsMenu.tsx  (new file)

import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { CompanyPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteCompany from "./DeleteCompany"
import EditCompany from "./EditCompany"

interface CompanyActionsMenuProps {
  company: CompanyPublic
}

export const CompanyActionsMenu = ({ company }: CompanyActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditCompany company={company} onSuccess={() => setOpen(false)} />
        <DeleteCompany id={company.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
