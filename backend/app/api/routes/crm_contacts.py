"""

"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import SessionDep
from app.api.deps_crm import TenantMembershipQueryDep, ManagerAboveQueryDep, assert_can_edit
from app.models import (
    Contact, ContactCreate, ContactPublic, ContactsPublic, ContactUpdate,
    CRMCompany, Message, get_datetime_utc,
)

router = APIRouter(prefix="/crm/contacts", tags=["crm-contacts"])


@router.get("/", response_model=ContactsPublic)
def read_contacts(
    session: SessionDep, membership: TenantMembershipQueryDep,
    company_id: uuid.UUID | None = None,
    skip: int = 0, limit: int = 100,
) -> Any:
    tid = membership.tenant_id
    stmt = select(Contact).where(Contact.tenant_id == tid)
    if company_id:
        stmt = stmt.where(Contact.company_id == company_id)
    count = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    contacts = session.exec(stmt.order_by(col(Contact.created_at).desc()).offset(skip).limit(limit)).all()
    return ContactsPublic(data=[ContactPublic.model_validate(c) for c in contacts], count=count)


@router.get("/{id}", response_model=ContactPublic)
def read_contact(session: SessionDep, membership: TenantMembershipQueryDep, id: uuid.UUID) -> Any:
    contact = session.get(Contact, id)
    if not contact or contact.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.post("/", response_model=ContactPublic)
def create_contact(
    *, session: SessionDep, membership: TenantMembershipQueryDep, contact_in: ContactCreate
) -> Any:
    # Verify company belongs to tenant
    company = session.get(CRMCompany, contact_in.company_id)
    if not company or company.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Company not found")
    contact = Contact.model_validate(contact_in, update={"tenant_id": membership.tenant_id})
    session.add(contact); session.commit(); session.refresh(contact)
    return contact


@router.put("/{id}", response_model=ContactPublic)
def update_contact(
    *, session: SessionDep, membership: TenantMembershipQueryDep,
    id: uuid.UUID, contact_in: ContactUpdate
) -> Any:
    contact = session.get(Contact, id)
    if not contact or contact.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    # Sales reps can edit contacts (no owner_id on contacts); managers+ always can
    # Business rule: all roles can edit contacts — adjust if needed
    contact.sqlmodel_update(contact_in.model_dump(exclude_unset=True))
    contact.updated_at = get_datetime_utc()
    session.add(contact); session.commit(); session.refresh(contact)
    return contact


@router.delete("/{id}")
def delete_contact(session: SessionDep, membership: ManagerAboveQueryDep, id: uuid.UUID) -> Message:
    contact = session.get(Contact, id)
    if not contact or contact.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    session.delete(contact); session.commit()
    return Message(message="Contact deleted successfully")
