// ============================================================
// frontend/src/components/CRM/Contacts/EditContact.tsx
// ============================================================

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  type ContactPublic,
  CrmCompaniesService,
  CrmContactsService,
} from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { useTenant } from "@/hooks/useTenant"
import { handleError } from "@/utils"

const editSchema = z.object({
  first_name: z.string().min(1, "Required").optional(),
  last_name: z.string().min(1, "Required").optional(),
  company_id: z.string().uuid().optional(),
  title: z.string().max(255).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  linkedin_url: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})
type EditFormData = z.infer<typeof editSchema>

export default function EditContact({
  contact,
  onSuccess,
}: {
  contact: ContactPublic
  onSuccess: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: companies } = useQuery({
    queryKey: ["crm-companies", tenantId],
    queryFn: () =>
      CrmCompaniesService.readCompanies({ tenantId, skip: 0, limit: 200 }),
    enabled: isOpen,
  })

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      company_id: contact.company_id,
      title: contact.title ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      linkedin_url: contact.linkedin_url ?? "",
      notes: contact.notes ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: EditFormData) =>
      CrmContactsService.updateContact({
        id: contact.id,
        tenantId,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Contact updated")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", tenantId] }),
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="mr-2 size-4" /> Edit Contact
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update contact details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
            <div className="grid gap-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                {(["first_name", "last_name"] as const).map((f) => (
                  <FormField
                    key={f}
                    control={form.control}
                    name={f}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize">
                          {f.replace("_", " ")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {companies?.data.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              {(
                ["title", "email", "phone", "linkedin_url", "notes"] as const
              ).map((f) => (
                <FormField
                  key={f}
                  control={form.control}
                  name={f}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">
                        {f.replace("_", " ")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={f === "email" ? "email" : "text"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
