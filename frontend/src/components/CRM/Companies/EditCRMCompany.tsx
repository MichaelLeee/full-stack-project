// ============================================================
// frontend/src/components/CRM/Companies/EditCRMCompany.tsx
// ============================================================

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { type CRMCompanyPublic, CrmCompaniesService } from "@/client"
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

const schema = z.object({
  name: z.string().min(1, "Required"),
  website: z.string().max(255).optional(),
  industry: z.string().max(255).optional(),
  employee_count: z.coerce.number().int().min(0).optional(),
  annual_revenue: z.coerce.number().min(0).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
})
type FormData = z.infer<typeof schema>

export default function EditCRMCompany({
  company,
  onSuccess,
}: {
  company: CRMCompanyPublic
  onSuccess: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { tenantId } = useTenant()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company.name,
      website: company.website ?? "",
      industry: company.industry ?? "",
      employee_count: company.employee_count ?? undefined,
      annual_revenue: company.annual_revenue ?? undefined,
      address: company.address ?? "",
      city: company.city ?? "",
      state: company.state ?? "",
      country: company.country ?? "",
      notes: company.notes ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      CrmCompaniesService.updateCompany({
        id: company.id,
        tenantId,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Company updated")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["crm-companies", tenantId] }),
  })

  const TEXT_FIELDS = [
    "name",
    "website",
    "industry",
    "address",
    "city",
    "state",
    "country",
  ] as const
  const NUM_FIELDS = [
    { name: "employee_count" as const, label: "Employees" },
    { name: "annual_revenue" as const, label: "Annual Revenue ($)" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="mr-2 size-4" /> Edit Company
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>Update company details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
            <div className="grid gap-3 py-4">
              {TEXT_FIELDS.map((f) => (
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
              <div className="grid grid-cols-2 gap-3">
                {NUM_FIELDS.map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
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
