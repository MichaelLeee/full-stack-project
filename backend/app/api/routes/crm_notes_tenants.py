"""
backend/app/api/routes/crm_notes.py
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.deps_crm import TenantMembershipDep, assert_can_edit
from app.models import (
    Note, NoteCreate, NotePublic, NotesPublic, NoteUpdate, Message,
)

router = APIRouter(prefix="/crm/notes", tags=["crm-notes"])


@router.get("/", response_model=NotesPublic)
def read_notes(
    session: SessionDep,
    membership: TenantMembershipDep,
    company_id: uuid.UUID | None = None,
    contact_id: uuid.UUID | None = None,
    deal_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    tid = membership.tenant_id
    stmt = select(Note).where(Note.tenant_id == tid)
    if company_id: stmt = stmt.where(Note.company_id == company_id)
    if contact_id: stmt = stmt.where(Note.contact_id == contact_id)
    if deal_id:    stmt = stmt.where(Note.deal_id == deal_id)
    count = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    notes = session.exec(stmt.order_by(col(Note.created_at).desc()).offset(skip).limit(limit)).all()
    return NotesPublic(data=[NotePublic.model_validate(n) for n in notes], count=count)


@router.post("/", response_model=NotePublic)
def create_note(
    *, session: SessionDep, current_user: CurrentUser,
    membership: TenantMembershipDep, note_in: NoteCreate
) -> Any:
    note = Note.model_validate(
        note_in,
        update={"tenant_id": membership.tenant_id, "created_by": current_user.id},
    )
    session.add(note); session.commit(); session.refresh(note)
    return note


@router.put("/{id}", response_model=NotePublic)
def update_note(
    *, session: SessionDep, membership: TenantMembershipDep,
    id: uuid.UUID, note_in: NoteUpdate
) -> Any:
    note = session.get(Note, id)
    if not note or note.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Note not found")
    assert_can_edit(membership=membership, owner_id=note.created_by)
    note.sqlmodel_update(note_in.model_dump(exclude_unset=True))
    session.add(note); session.commit(); session.refresh(note)
    return note


@router.delete("/{id}")
def delete_note(session: SessionDep, membership: TenantMembershipDep, id: uuid.UUID) -> Message:
    note = session.get(Note, id)
    if not note or note.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Note not found")
    assert_can_edit(membership=membership, owner_id=note.created_by)
    session.delete(note); session.commit()
    return Message(message="Note deleted successfully")


# ─────────────────────────────────────────────────────────────────────────────
"""
backend/app/api/routes/crm_tenants.py
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func, col

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
