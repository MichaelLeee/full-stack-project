
import uuid
from datetime import datetime, timezone, date

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum

def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    tenant_memberships: list["TenantMembership"] = Relationship(
        back_populates="user", cascade_delete=True
    )



# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int

# ── Shared base ──────────────────────────────────────────────────────────────
class CompanyBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    website: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=255)


# ── API input schemas ─────────────────────────────────────────────────────────
class CompanyCreate(CompanyBase):
    pass                          # all fields inherited; none require transformation


class CompanyUpdate(SQLModel):    # all fields optional for PATCH semantics
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    website: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=255)


# ── Database table ────────────────────────────────────────────────────────────
class Company(CompanyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    # owner_id: uuid.UUID = Field(
    #     foreign_key="user.id", nullable=False, ondelete="CASCADE"
    # )
    # owner: User | None = Relationship(back_populates="companies")


# ── API response schemas ──────────────────────────────────────────────────────
class CompanyPublic(CompanyBase):
    id: uuid.UUID
    created_at: datetime | None = None


class CompaniesPublic(SQLModel):
    data: list[CompanyPublic]
    count: int

# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

"""
CRM Models

Key design decisions:
  - tenant_id on every CRM table → row-level tenant isolation
  - UserRole enum on User (extend existing User model)
  - All timestamps use get_datetime_utc() already defined in models.py
  - Relationships use back_populates for bidirectional navigation
  - cascade_delete on all FK relationships
"""

# ─────────────────────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    admin     = "admin"
    manager   = "manager"
    sales_rep = "sales_rep"


class DealStage(str, Enum):
    lead        = "lead"
    qualified   = "qualified"
    proposal    = "proposal"
    negotiation = "negotiation"
    closed_won  = "closed_won"
    closed_lost = "closed_lost"


class ActivityType(str, Enum):
    call    = "call"
    email   = "email"
    meeting = "meeting"
    task    = "task"


class NoteEntity(str, Enum):
    company  = "company"
    contact  = "contact"
    deal     = "deal"


# ─────────────────────────────────────────────────────────────────────────────
# Tenant
# ─────────────────────────────────────────────────────────────────────────────

class TenantBase(SQLModel):
    name:   str       = Field(min_length=1, max_length=255)
    domain: str | None = Field(default=None, max_length=255)


class TenantCreate(TenantBase):
    pass


class TenantUpdate(SQLModel):
    name:   str | None = Field(default=None, min_length=1, max_length=255)
    domain: str | None = Field(default=None, max_length=255)


class Tenant(TenantBase, table=True):
    id:         uuid.UUID       = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    # Relationships
    memberships: list["TenantMembership"] = Relationship(back_populates="tenant", cascade_delete=True)
    companies:   list["CRMCompany"]       = Relationship(back_populates="tenant",  cascade_delete=True)


class TenantPublic(TenantBase):
    id:         uuid.UUID
    created_at: datetime | None = None


class TenantsPublic(SQLModel):
    data:  list[TenantPublic]
    count: int


# ─────────────────────────────────────────────────────────────────────────────
# TenantMembership  (User ↔ Tenant with role)
# ─────────────────────────────────────────────────────────────────────────────

class TenantMembership(SQLModel, table=True):
    __tablename__ = "tenant_membership"

    id:        uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id:   uuid.UUID = Field(foreign_key="user.id",   nullable=False, ondelete="CASCADE")
    tenant_id: uuid.UUID = Field(foreign_key="tenant.id", nullable=False, ondelete="CASCADE")
    role:      UserRole  = Field(default=UserRole.sales_rep)

    # Relationships
    user:   "User"   = Relationship(back_populates="tenant_memberships")
    tenant: "Tenant" = Relationship(back_populates="memberships")


class TenantMembershipPublic(SQLModel):
    id:        uuid.UUID
    user_id:   uuid.UUID
    tenant_id: uuid.UUID
    role:      UserRole


# ─────────────────────────────────────────────────────────────────────────────
# CRMCompany   (named CRMCompany to avoid clash with Company added earlier)
# ─────────────────────────────────────────────────────────────────────────────

class CRMCompanyBase(SQLModel):
    name:            str        = Field(min_length=1, max_length=255)
    website:         str | None = Field(default=None, max_length=255)
    industry:        str | None = Field(default=None, max_length=255)
    employee_count:  int | None = Field(default=None, ge=0)
    annual_revenue:  float | None = Field(default=None, ge=0)
    address:         str | None = Field(default=None, max_length=500)
    city:            str | None = Field(default=None, max_length=100)
    state:           str | None = Field(default=None, max_length=100)
    country:         str | None = Field(default=None, max_length=100)
    notes:           str | None = Field(default=None, max_length=2000)


class CRMCompanyCreate(CRMCompanyBase):
    pass


class CRMCompanyUpdate(SQLModel):
    name:            str | None   = Field(default=None, min_length=1, max_length=255)
    website:         str | None   = Field(default=None, max_length=255)
    industry:        str | None   = Field(default=None, max_length=255)
    employee_count:  int | None   = Field(default=None, ge=0)
    annual_revenue:  float | None = Field(default=None, ge=0)
    address:         str | None   = Field(default=None, max_length=500)
    city:            str | None   = Field(default=None, max_length=100)
    state:           str | None   = Field(default=None, max_length=100)
    country:         str | None   = Field(default=None, max_length=100)
    notes:           str | None   = Field(default=None, max_length=2000)


class CRMCompany(CRMCompanyBase, table=True):
    __tablename__ = "crm_company"

    id:         uuid.UUID       = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id:  uuid.UUID       = Field(foreign_key="tenant.id", nullable=False, ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore
    updated_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore

    # Relationships
    tenant:     "Tenant"           = Relationship(back_populates="companies")
    contacts:   list["Contact"]    = Relationship(back_populates="company", cascade_delete=True)
    deals:      list["Deal"]       = Relationship(back_populates="company", cascade_delete=True)
    activities: list["Activity"]   = Relationship(back_populates="company", cascade_delete=True)
    # notes:      list["Note"]       = Relationship(back_populates="company", cascade_delete=True)
    company_notes: list["Note"] = Relationship(back_populates="company", cascade_delete=True)


class CRMCompanyPublic(CRMCompanyBase):
    id:         uuid.UUID
    tenant_id:  uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CRMCompaniesPublic(SQLModel):
    data:  list[CRMCompanyPublic]
    count: int


# ─────────────────────────────────────────────────────────────────────────────
# Contact
# ─────────────────────────────────────────────────────────────────────────────

class ContactBase(SQLModel):
    first_name:   str        = Field(min_length=1, max_length=100)
    last_name:    str        = Field(min_length=1, max_length=100)
    title:        str | None = Field(default=None, max_length=255)
    email:        str | None = Field(default=None, max_length=255)
    phone:        str | None = Field(default=None, max_length=50)
    linkedin_url: str | None = Field(default=None, max_length=500)
    notes:        str | None = Field(default=None, max_length=2000)


class ContactCreate(ContactBase):
    company_id: uuid.UUID


class ContactUpdate(SQLModel):
    first_name:   str | None = Field(default=None, min_length=1, max_length=100)
    last_name:    str | None = Field(default=None, min_length=1, max_length=100)
    title:        str | None = Field(default=None, max_length=255)
    email:        str | None = Field(default=None, max_length=255)
    phone:        str | None = Field(default=None, max_length=50)
    linkedin_url: str | None = Field(default=None, max_length=500)
    notes:        str | None = Field(default=None, max_length=2000)
    company_id:   uuid.UUID | None = None


class Contact(ContactBase, table=True):
    id:         uuid.UUID       = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID       = Field(foreign_key="crm_company.id", nullable=False, ondelete="CASCADE", index=True)
    tenant_id:  uuid.UUID       = Field(foreign_key="tenant.id",      nullable=False, ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore
    updated_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore

    # Relationships
    company:    "CRMCompany"   = Relationship(back_populates="contacts")
    deals:      list["Deal"]   = Relationship(back_populates="contact")
    activities: list["Activity"] = Relationship(back_populates="contact", cascade_delete=True)
    # notes:      list["Note"]   = Relationship(back_populates="contact",  cascade_delete=True)
    contact_notes: list["Note"] = Relationship(back_populates="contact", cascade_delete=True)


class ContactPublic(ContactBase):
    id:         uuid.UUID
    company_id: uuid.UUID
    tenant_id:  uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ContactsPublic(SQLModel):
    data:  list[ContactPublic]
    count: int


# ─────────────────────────────────────────────────────────────────────────────
# Deal
# ─────────────────────────────────────────────────────────────────────────────

class DealBase(SQLModel):
    name:                str        = Field(min_length=1, max_length=255)
    amount:              float | None = Field(default=None, ge=0)
    stage:               DealStage  = Field(default=DealStage.lead)
    probability:         int | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None
    notes:               str | None = Field(default=None, max_length=2000)


class DealCreate(DealBase):
    company_id:  uuid.UUID
    contact_id:  uuid.UUID | None = None


class DealUpdate(SQLModel):
    name:                str | None   = Field(default=None, min_length=1, max_length=255)
    amount:              float | None = Field(default=None, ge=0)
    stage:               DealStage | None = None
    probability:         int | None   = Field(default=None, ge=0, le=100)
    expected_close_date: date | None  = None
    notes:               str | None   = Field(default=None, max_length=2000)
    company_id:          uuid.UUID | None = None
    contact_id:          uuid.UUID | None = None


class Deal(DealBase, table=True):
    id:         uuid.UUID       = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID       = Field(foreign_key="crm_company.id", nullable=False, ondelete="CASCADE", index=True)
    contact_id: uuid.UUID | None = Field(default=None, foreign_key="contact.id", ondelete="SET NULL", index=True)
    owner_id:   uuid.UUID       = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True)
    tenant_id:  uuid.UUID       = Field(foreign_key="tenant.id", nullable=False, ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore
    updated_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore

    # Relationships
    company:    "CRMCompany"   = Relationship(back_populates="deals")
    # contact:    "Contact" | None = Relationship(back_populates="deals")
    contact: Contact | None = Relationship(back_populates="deals")
    activities: list["Activity"] = Relationship(back_populates="deal", cascade_delete=True)
    # notes:      list["Note"]   = Relationship(back_populates="deal",  cascade_delete=True)
    deal_notes: list["Note"] = Relationship(back_populates="deal", cascade_delete=True)


class DealPublic(DealBase):
    id:         uuid.UUID
    company_id: uuid.UUID
    contact_id: uuid.UUID | None
    owner_id:   uuid.UUID
    tenant_id:  uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DealsPublic(SQLModel):
    data:  list[DealPublic]
    count: int


# ─────────────────────────────────────────────────────────────────────────────
# Activity
# ─────────────────────────────────────────────────────────────────────────────

class ActivityBase(SQLModel):
    type:        ActivityType
    subject:     str        = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    due_date:    datetime | None = None
    completed:   bool       = False


class ActivityCreate(ActivityBase):
    company_id: uuid.UUID
    contact_id: uuid.UUID | None = None
    deal_id:    uuid.UUID | None = None


class ActivityUpdate(SQLModel):
    type:        ActivityType | None = None
    subject:     str | None   = Field(default=None, min_length=1, max_length=255)
    description: str | None   = Field(default=None, max_length=2000)
    due_date:    datetime | None = None
    completed:   bool | None  = None
    company_id:  uuid.UUID | None = None
    contact_id:  uuid.UUID | None = None
    deal_id:     uuid.UUID | None = None


class Activity(ActivityBase, table=True):
    id:         uuid.UUID       = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID       = Field(foreign_key="crm_company.id", nullable=False, ondelete="CASCADE", index=True)
    contact_id: uuid.UUID | None = Field(default=None, foreign_key="contact.id", ondelete="SET NULL")
    deal_id:    uuid.UUID | None = Field(default=None, foreign_key="deal.id",    ondelete="SET NULL")
    owner_id:   uuid.UUID       = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True)
    tenant_id:  uuid.UUID       = Field(foreign_key="tenant.id", nullable=False, ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore

    # Relationships
    # company: "CRMCompany" = Relationship(back_populates="activities")
    # contact: "Contact" | None = Relationship(back_populates="activities")
    # deal:    "Deal"    | None = Relationship(back_populates="activities")
    company: "CRMCompany" = Relationship(back_populates="activities")
    contact: Contact | None = Relationship(back_populates="activities")
    deal:    Deal    | None = Relationship(back_populates="activities")


class ActivityPublic(ActivityBase):
    id:         uuid.UUID
    company_id: uuid.UUID
    contact_id: uuid.UUID | None
    deal_id:    uuid.UUID | None
    owner_id:   uuid.UUID
    tenant_id:  uuid.UUID
    created_at: datetime | None = None


class ActivitiesPublic(SQLModel):
    data:  list[ActivityPublic]
    count: int


# ─────────────────────────────────────────────────────────────────────────────
# Note
# ─────────────────────────────────────────────────────────────────────────────

class NoteBase(SQLModel):
    content: str = Field(min_length=1, max_length=5000)


class NoteCreate(NoteBase):
    company_id: uuid.UUID | None = None
    contact_id: uuid.UUID | None = None
    deal_id:    uuid.UUID | None = None


class NoteUpdate(SQLModel):
    content: str | None = Field(default=None, min_length=1, max_length=5000)


class Note(NoteBase, table=True):
    id:         uuid.UUID       = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID | None = Field(default=None, foreign_key="crm_company.id", ondelete="CASCADE", index=True)
    contact_id: uuid.UUID | None = Field(default=None, foreign_key="contact.id",     ondelete="CASCADE", index=True)
    deal_id:    uuid.UUID | None = Field(default=None, foreign_key="deal.id",         ondelete="CASCADE", index=True)
    created_by: uuid.UUID       = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True)
    tenant_id:  uuid.UUID       = Field(foreign_key="tenant.id", nullable=False, ondelete="CASCADE", index=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore

    # Relationships
    # company: "CRMCompany" | None = Relationship(back_populates="notes")
    # contact: "Contact"    | None = Relationship(back_populates="notes")
    # deal:    "Deal"       | None = Relationship(back_populates="notes")
    # company: CRMCompany | None = Relationship(back_populates="notes")
    # contact: Contact    | None = Relationship(back_populates="notes")
    # deal:    Deal       | None = Relationship(back_populates="notes")
    company: CRMCompany | None = Relationship(back_populates="company_notes")
    contact: Contact    | None = Relationship(back_populates="contact_notes")
    deal:    Deal       | None = Relationship(back_populates="deal_notes")


class NotePublic(NoteBase):
    id:         uuid.UUID
    company_id: uuid.UUID | None
    contact_id: uuid.UUID | None
    deal_id:    uuid.UUID | None
    created_by: uuid.UUID
    tenant_id:  uuid.UUID
    created_at: datetime | None = None


class NotesPublic(SQLModel):
    data:  list[NotePublic]
    count: int

