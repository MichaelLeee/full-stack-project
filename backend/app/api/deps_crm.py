"""
Tenant-aware dependency injection for all CRM routes.
Import these instead of CurrentUser when you need tenant context.
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, Path, Query

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Tenant,
    TenantMembership,
    UserRole,
)
from sqlmodel import select


# ─────────────────────────────────────────────────────────────────────────────
# Resolve current user's membership in a tenant
# ─────────────────────────────────────────────────────────────────────────────

def get_tenant_membership(
    session: SessionDep,
    current_user: CurrentUser,
    # tenant_id: uuid.UUID = Query(..., description="Tenant UUID"),
    tenant_id: uuid.UUID = Path(..., description="Tenant UUID"),
) -> TenantMembership:
    """
    Resolves the current user's membership in the requested tenant.
    Raises 403 if the user is not a member.
    Raises 404 if the tenant does not exist.
    """
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    stmt = (
        select(TenantMembership)
        .where(TenantMembership.tenant_id == tenant_id)
        .where(TenantMembership.user_id == current_user.id)
    )
    membership = session.exec(stmt).first()
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this tenant",
        )
    return membership


TenantMembershipDep = Annotated[TenantMembership, Depends(get_tenant_membership)]

# ─────────────────────────────────────────────────────────────────────────────
# Role-based guards — compose on top of TenantMembershipDep
# ─────────────────────────────────────────────────────────────────────────────

def require_admin(membership: TenantMembershipDep) -> TenantMembership:
    """Only admins can perform this action."""
    if membership.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin role required")
    return membership


def require_manager_or_above(membership: TenantMembershipDep) -> TenantMembership:
    """Managers and admins can perform this action."""
    if membership.role not in (UserRole.admin, UserRole.manager):
        raise HTTPException(
            status_code=403, detail="Manager or Admin role required"
        )
    return membership


AdminDep          = Annotated[TenantMembership, Depends(require_admin)]
ManagerAboveDep   = Annotated[TenantMembership, Depends(require_manager_or_above)]


# ─────────────────────────────────────────────────────────────────────────────
# Ownership check helpers — used inside route handlers
# ─────────────────────────────────────────────────────────────────────────────

def assert_can_edit(
    *,
    membership: TenantMembership,
    owner_id: uuid.UUID,
) -> None:
    """
    Sales reps can only edit records they own.
    Managers and admins can edit any record in the tenant.
    Raises 403 otherwise.
    """
    if membership.role == UserRole.sales_rep and membership.user_id != owner_id:
        raise HTTPException(
            status_code=403,
            detail="Sales reps can only edit their own records",
        )

def get_tenant_membership_from_query(
      session: SessionDep,
      current_user: CurrentUser,
      tenant_id: uuid.UUID = Query(..., description="Tenant UUID"),
  ) -> TenantMembership:
      """
      Same as get_tenant_membership but reads tenant_id from ?tenant_id=...
      Use this for routes that do NOT have {tenant_id} in their path.
      """
      tenant = session.get(Tenant, tenant_id)
      if not tenant:
          raise HTTPException(status_code=404, detail="Tenant not found")

      stmt = (
          select(TenantMembership)
          .where(TenantMembership.tenant_id == tenant_id)
          .where(TenantMembership.user_id == current_user.id)
      )
      membership = session.exec(stmt).first()
      if not membership:
          raise HTTPException(
              status_code=403,
              detail="You are not a member of this tenant",
          )
      return membership

TenantMembershipQueryDep = Annotated[TenantMembership, Depends(get_tenant_membership_from_query)]

def require_admin_query(membership: TenantMembershipQueryDep) -> TenantMembership:
    if membership.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin role required")
    return membership 

def require_manager_or_above_query(membership: TenantMembershipQueryDep) -> TenantMembership:
    if membership.role not in (UserRole.admin, UserRole.manager):
        raise HTTPException(status_code=403, detail="Manager or Admin role required")
    return membership

AdminQueryDep = Annotated[TenantMembership, Depends(require_admin_query)]
ManagerAboveQueryDep = Annotated[TenantMembership, Depends(require_manager_or_above_query)]