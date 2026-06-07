// ============================================================
// frontend/src/components/CRM/Contacts/AddContact.tsx
// ============================================================

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  type ContactCreate,
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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company_id: z.string().uuid("Select a company"),
  title: z.string().max(255).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  linkedin_url: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})
type FormData = z.infer<typeof schema>

export default function AddContact({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: companies } = useQuery({
    queryKey: ["crm-companies", tenantId],
    queryFn: () =>
      CrmCompaniesService.readCompanies({ tenantId, skip: 0, limit: 200 }),
    enabled: isOpen,
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      company_id: "",
      title: "",
      email: "",
      phone: "",
      linkedin_url: "",
      notes: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ContactCreate) =>
      CrmContactsService.createContact({ tenantId, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Contact created")
      form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["crm-contacts", tenantId] }),
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>Add a person to your CRM.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) =>
              mutation.mutate(d as ContactCreate),
            )}
          >
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
                          {f.replace("_", " ")}{" "}
                          <span className="text-destructive">*</span>
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

              {/* Company select */}
              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select company...</option>
                        {companies?.data.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(["title", "email", "phone", "linkedin_url"] as const).map(
                (f) => (
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
                            placeholder={
                              f === "linkedin_url"
                                ? "https://linkedin.com/in/..."
                                : undefined
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ),
              )}

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
