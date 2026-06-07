"""

"""
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.deps_crm import ManagerAboveQueryDep, TenantMembershipQueryDep, assert_can_edit

from app.models import (
    CRMCompaniesPublic,
    CRMCompany,
    CRMCompanyCreate,
    CRMCompanyPublic,
    CRMCompanyUpdate,
    Message,
    get_datetime_utc,
)

router = APIRouter(prefix="/crm/companies", tags=["crm-companies"])


@router.get("/", response_model=CRMCompaniesPublic)
def read_companies(
    session: SessionDep,
    membership: TenantMembershipQueryDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """List all companies in the tenant. All roles can read."""
    tid = membership.tenant_id
    count = session.exec(
        select(func.count()).select_from(CRMCompany).where(CRMCompany.tenant_id == tid)
    ).one()
    companies = session.exec(
        select(CRMCompany)
        .where(CRMCompany.tenant_id == tid)
        .order_by(col(CRMCompany.created_at).desc())
        .offset(skip).limit(limit)
    ).all()
    return CRMCompaniesPublic(data=[CRMCompanyPublic.model_validate(c) for c in companies], count=count)


@router.get("/{id}", response_model=CRMCompanyPublic)
def read_company(session: SessionDep, membership: TenantMembershipQueryDep, id: uuid.UUID) -> Any:
    company = session.get(CRMCompany, id)
    if not company or company.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/", response_model=CRMCompanyPublic)
def create_company(
    *, session: SessionDep, membership: TenantMembershipQueryDep, company_in: CRMCompanyCreate
) -> Any:
    company = CRMCompany.model_validate(company_in, update={"tenant_id": membership.tenant_id})
    session.add(company); session.commit(); session.refresh(company)
    return company


@router.put("/{id}", response_model=CRMCompanyPublic)
def update_company(
    *, session: SessionDep, membership: ManagerAboveQueryDep, id: uuid.UUID, company_in: CRMCompanyUpdate
) -> Any:
    company = session.get(CRMCompany, id)
    if not company or company.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Company not found")
    company.sqlmodel_update(company_in.model_dump(exclude_unset=True))
    company.updated_at = get_datetime_utc()
    session.add(company); session.commit(); session.refresh(company)
    return company


@router.delete("/{id}")
def delete_company(session: SessionDep, membership: ManagerAboveQueryDep, id: uuid.UUID) -> Message:
    company = session.get(CRMCompany, id)
    if not company or company.tenant_id != membership.tenant_id:
        raise HTTPException(status_code=404, detail="Company not found")
    session.delete(company); session.commit()
    return Message(message="Company deleted successfully")
