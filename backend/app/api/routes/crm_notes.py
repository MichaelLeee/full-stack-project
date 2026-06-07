"""
backend/app/api/routes/crm_notes.py
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.deps_crm import TenantMembershipQueryDep, assert_can_edit
from app.models import (
    Note, NoteCreate, NotePublic, NotesPublic, NoteUpdate, Message,
)

router = APIRouter(prefix="/crm/notes", tags=["crm-notes"])


@router.get("/", response_model=NotesPublic)
def read_notes(
    session: SessionDep,
    membership: TenantMembershipQueryDep,
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
    membership: TenantMembershipQueryDep, note_in: NoteCreate
) -> Any:
    note = Note.model_validate(
        note_in,
        update={"tenant_id": membership.tenant_id, "created_by": current_user.id},
    )
    session.add(note); session.commit(); session.refresh(note)
    return note


@router.put("/{id}", response_model=NotePublic)
def update_note(
    *, session: SessionDep, membership: TenantMembershipQueryDep,
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
def delete_note(session: SessionDep, membership: TenantMembershipQueryDep, id: uuid.UUID) -> Message:
    note = session.get(Note, id)
    if not note or note.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Note not found")
    assert_can_edit(membership=membership, owner_id=note.created_by)
    session.delete(note); session.commit()
    return Message(message="Note deleted successfully")

