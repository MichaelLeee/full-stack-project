// ============================================================
// frontend/src/components/CRM/Companies/AddCRMCompany.tsx
// ============================================================

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { type CRMCompanyCreate, CrmCompaniesService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { handleError } from "@/utils"

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
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

export default function AddCRMCompany({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      website: "",
      industry: "",
      city: "",
      country: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CRMCompanyCreate) =>
      CrmCompaniesService.createCompany({ tenantId, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Company created")
      form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["crm-companies", tenantId] }),
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
          <DialogDescription>
            Add a new organization to your CRM.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
            <div className="grid gap-3 py-4">
              {(
                [
                  "name",
                  "website",
                  "industry",
                  "city",
                  "state",
                  "country",
                  "address",
                ] as const
              ).map((f) => (
                <FormField
                  key={f}
                  control={form.control}
                  name={f}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">
                        {f.replace("_", " ")}
                        {f === "name" && (
                          <span className="text-destructive"> *</span>
                        )}
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
                {(["employee_count", "annual_revenue"] as const).map((f) => (
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
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
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
