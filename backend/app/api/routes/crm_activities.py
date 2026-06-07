"""

"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.deps_crm import TenantMembershipQueryDep, ManagerAboveDep, assert_can_edit
from app.models import (
    Activity, ActivityCreate, ActivityPublic, ActivitiesPublic,
    ActivityUpdate, Message, get_datetime_utc,
)

router = APIRouter(prefix="/crm/activities", tags=["crm-activities"])


@router.get("/", response_model=ActivitiesPublic)
def read_activities(
    session: SessionDep,
    membership: TenantMembershipQueryDep,
    company_id: uuid.UUID | None = None,
    deal_id: uuid.UUID | None = None,
    contact_id: uuid.UUID | None = None,
    completed: bool | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    tid = membership.tenant_id
    stmt = select(Activity).where(Activity.tenant_id == tid)
    if company_id:  stmt = stmt.where(Activity.company_id == company_id)
    if deal_id:     stmt = stmt.where(Activity.deal_id == deal_id)
    if contact_id:  stmt = stmt.where(Activity.contact_id == contact_id)
    if completed is not None: stmt = stmt.where(Activity.completed == completed)
    count = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    activities = session.exec(
        stmt.order_by(col(Activity.due_date).asc()).offset(skip).limit(limit)
    ).all()
    return ActivitiesPublic(data=[ActivityPublic.model_validate(a) for a in activities], count=count)


@router.get("/{id}", response_model=ActivityPublic)
def read_activity(session: SessionDep, membership: TenantMembershipQueryDep, id: uuid.UUID) -> Any:
    activity = session.get(Activity, id)
    if not activity or activity.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.post("/", response_model=ActivityPublic)
def create_activity(
    *, session: SessionDep, current_user: CurrentUser,
    membership: TenantMembershipQueryDep, activity_in: ActivityCreate
) -> Any:
    activity = Activity.model_validate(
        activity_in,
        update={"tenant_id": membership.tenant_id, "owner_id": current_user.id},
    )
    session.add(activity); session.commit(); session.refresh(activity)
    return activity


@router.put("/{id}", response_model=ActivityPublic)
def update_activity(
    *, session: SessionDep, membership: TenantMembershipQueryDep,
    id: uuid.UUID, activity_in: ActivityUpdate
) -> Any:
    activity = session.get(Activity, id)
    if not activity or activity.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    assert_can_edit(membership=membership, owner_id=activity.owner_id)
    activity.sqlmodel_update(activity_in.model_dump(exclude_unset=True))
    session.add(activity); session.commit(); session.refresh(activity)
    return activity


@router.delete("/{id}")
def delete_activity(session: SessionDep, membership: TenantMembershipQueryDep, id: uuid.UUID) -> Message:
    activity = session.get(Activity, id)
    if not activity or activity.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    assert_can_edit(membership=membership, owner_id=activity.owner_id)
    session.delete(activity); session.commit()
    return Message(message="Activity deleted successfully")
