// ============================================================
// frontend/src/components/CRM/Activities/ActivityActionsMenu.tsx
// ============================================================

import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import type { ActivityPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteActivity from "./DeleteActivity"
import EditActivity from "./EditActivity"

export function ActivityActionsMenu({
  activity,
}: {
  activity: ActivityPublic
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
        <EditActivity activity={activity} onSuccess={() => setOpen(false)} />
        <DeleteActivity id={activity.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
