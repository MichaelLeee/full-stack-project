// ============================================================
// frontend/src/hooks/useTenant.ts
// ============================================================
// Provides the current tenant_id from localStorage or context.
// In a real app this would come from user profile / route params.

export function useTenant() {
  const tenantId = localStorage.getItem("tenant_id") ?? ""
  return { tenantId }
}
