
# ─────────────────────────────────────────────────────────────────────────────
"""
backend/app/api/routes/crm_tenants.py
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, select, func, col

from app.api.deps import CurrentUser, SessionDep
from app.api.deps_crm import AdminDep, TenantMembershipDep
from app.models import (
    Tenant, TenantCreate, TenantPublic, TenantsPublic, TenantUpdate,
    TenantMembership, TenantMembershipPublic, UserRole, Message,
    get_datetime_utc,
)

router_tenants = APIRouter(prefix="/crm/tenants", tags=["crm-tenants"])


@router_tenants.post("/", response_model=TenantPublic)
def create_tenant(
    *, session: SessionDep, current_user: CurrentUser, tenant_in: TenantCreate
) -> Any:
    """Any authenticated user can create a tenant (they become admin)."""
    tenant = Tenant.model_validate(tenant_in)
    session.add(tenant); session.flush()   # get id before commit
    # Make creator an admin member
    membership = TenantMembership(
        user_id=current_user.id,
        tenant_id=tenant.id,
        role=UserRole.admin,
    )
    session.add(membership); session.commit(); session.refresh(tenant)
    return tenant


@router_tenants.get("/{tenant_id}", response_model=TenantPublic)
def read_tenant(session: SessionDep, membership: TenantMembershipDep) -> Any:
    tenant = session.get(Tenant, membership.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router_tenants.put("/{tenant_id}", response_model=TenantPublic)
def update_tenant(
    *, session: SessionDep, membership: AdminDep,
    tenant_in: TenantUpdate
) -> Any:
    tenant = session.get(Tenant, membership.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.sqlmodel_update(tenant_in.model_dump(exclude_unset=True))
    session.add(tenant); session.commit(); session.refresh(tenant)
    return tenant


# ── Member management ──────────────────────────────────────────────────────

class InviteMemberRequest(SQLModel):
    user_id: uuid.UUID
    role: UserRole = UserRole.sales_rep


@router_tenants.post("/{tenant_id}/members", response_model=TenantMembershipPublic)
def add_member(
    *, session: SessionDep, membership: AdminDep, body: InviteMemberRequest
) -> Any:
    # Check no duplicate
    existing = session.exec(
        select(TenantMembership)
        .where(TenantMembership.tenant_id == membership.tenant_id)
        .where(TenantMembership.user_id == body.user_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    new_membership = TenantMembership(
        user_id=body.user_id,
        tenant_id=membership.tenant_id,
        role=body.role,
    )
    session.add(new_membership); session.commit(); session.refresh(new_membership)
    return new_membership


@router_tenants.delete("/{tenant_id}/members/{user_id}")
def remove_member(
    session: SessionDep, membership: AdminDep, user_id: uuid.UUID
) -> Message:
    m = session.exec(
        select(TenantMembership)
        .where(TenantMembership.tenant_id == membership.tenant_id)
        .where(TenantMembership.user_id == user_id)
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    session.delete(m); session.commit()
    return Message(message="Member removed")
