// ============================================================
// frontend/src/components/CRM/Activities/AddActivity.tsx
// ============================================================

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  type ActivityCreate,
  CrmActivitiesService,
  CrmCompaniesService,
  CrmContactsService,
  CrmDealsService,
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

const TYPES = ["call", "email", "meeting", "task"] as const

const schema = z.object({
  type: z.enum(TYPES),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().max(2000).optional(),
  company_id: z.string().uuid("Select a company"),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().optional(),
  completed: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

export default function AddActivity({ tenantId }: { tenantId: string }) {
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
      type: "call",
      subject: "",
      company_id: "",
      contact_id: "",
      deal_id: "",
      completed: false,
    },
  })

  const selectedCompanyId = form.watch("company_id")

  const { data: contacts } = useQuery({
    queryKey: ["crm-contacts", tenantId, selectedCompanyId],
    queryFn: () =>
      CrmContactsService.readContacts({
        tenantId,
        companyId: selectedCompanyId,
        skip: 0,
        limit: 200,
      }),
    enabled: isOpen && !!selectedCompanyId,
  })

  const { data: deals } = useQuery({
    queryKey: ["crm-deals", tenantId, selectedCompanyId],
    queryFn: () =>
      CrmDealsService.readDeals({
        tenantId,
        companyId: selectedCompanyId,
        skip: 0,
        limit: 200,
      }),
    enabled: isOpen && !!selectedCompanyId,
  })

  const mutation = useMutation({
    mutationFn: (data: ActivityCreate) =>
      CrmActivitiesService.createActivity({ tenantId, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Activity created")
      form.reset()
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["crm-activities", tenantId] }),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      contact_id: data.contact_id || undefined,
      deal_id: data.deal_id || undefined,
    } as ActivityCreate)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
          <DialogDescription>
            Log a call, email, meeting, or task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-3 py-4">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
                      >
                        {TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Subject */}
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Subject <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Discovery call with CEO"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company */}
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

              {/* Contact — filtered by company */}
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={!selectedCompanyId}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                      >
                        <option value="">No contact</option>
                        {contacts?.data.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.first_name} {c.last_name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Deal — filtered by company */}
              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={!selectedCompanyId}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                      >
                        <option value="">No deal</option>
                        {deals?.data.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Due date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
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
