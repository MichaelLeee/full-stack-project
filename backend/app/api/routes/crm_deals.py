"""
backend/app/api/routes/crm_deals.py
"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.deps_crm import TenantMembershipQueryDep, ManagerAboveQueryDep, assert_can_edit
from app.models import (
    CRMCompany, Contact, Deal, DealCreate, DealPublic, DealsPublic,
    DealStage, DealUpdate, Message, get_datetime_utc,
)

router = APIRouter(prefix="/crm/deals", tags=["crm-deals"])


@router.get("/", response_model=DealsPublic)
def read_deals(
    session: SessionDep,
    current_user: CurrentUser,
    membership: TenantMembershipQueryDep,
    company_id: uuid.UUID | None = None,
    stage: DealStage | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    All roles can read deals.
    Sales reps see all deals (read-only for others' deals).
    """
    from app.models import UserRole
    tid = membership.tenant_id
    stmt = select(Deal).where(Deal.tenant_id == tid)
    if company_id:
        stmt = stmt.where(Deal.company_id == company_id)
    if stage:
        stmt = stmt.where(Deal.stage == stage)
    count = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    deals = session.exec(
        stmt.order_by(col(Deal.created_at).desc()).offset(skip).limit(limit)
    ).all()
    return DealsPublic(data=[DealPublic.model_validate(d) for d in deals], count=count)


@router.get("/{id}", response_model=DealPublic)
def read_deal(session: SessionDep, membership: TenantMembershipQueryDep, id: uuid.UUID) -> Any:
    deal = session.get(Deal, id)
    if not deal or deal.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.post("/", response_model=DealPublic)
def create_deal(
    *, session: SessionDep, current_user: CurrentUser,
    membership: TenantMembershipQueryDep, deal_in: DealCreate
) -> Any:
    company = session.get(CRMCompany, deal_in.company_id)
    if not company or company.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Company not found")
    if deal_in.contact_id:
        contact = session.get(Contact, deal_in.contact_id)
        if not contact or contact.tenant_id != membership.tenant_id:
            raise HTTPException(status_code=404, detail="Contact not found")
    deal = Deal.model_validate(
        deal_in,
        update={"tenant_id": membership.tenant_id, "owner_id": current_user.id},
    )
    session.add(deal); session.commit(); session.refresh(deal)
    return deal


@router.put("/{id}", response_model=DealPublic)
def update_deal(
    *, session: SessionDep, membership: TenantMembershipQueryDep,
    id: uuid.UUID, deal_in: DealUpdate
) -> Any:
    deal = session.get(Deal, id)
    if not deal or deal.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Deal not found")
    # Sales reps can only edit their own deals
    assert_can_edit(membership=membership, owner_id=deal.owner_id)
    deal.sqlmodel_update(deal_in.model_dump(exclude_unset=True))
    deal.updated_at = get_datetime_utc()
    session.add(deal); session.commit(); session.refresh(deal)
    return deal


@router.delete("/{id}")
def delete_deal(session: SessionDep, membership: ManagerAboveQueryDep, id: uuid.UUID) -> Message:
    deal = session.get(Deal, id)
    if not deal or deal.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Deal not found")
    session.delete(deal); session.commit()
    return Message(message="Deal deleted successfully")
