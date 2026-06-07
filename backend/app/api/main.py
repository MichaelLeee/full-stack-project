
from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils
from app.api.routes.crm_companies  import router as crm_companies_router
from app.api.routes.crm_contacts   import router as crm_contacts_router
from app.api.routes.crm_deals      import router as crm_deals_router
from app.api.routes.crm_activities import router as crm_activities_router
from app.api.routes.crm_notes      import router as crm_notes_router
from app.api.routes.crm_tenants    import router_tenants as crm_tenants_router
from app.core.config import settings

api_router = APIRouter()

# Existing routes
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)

# CRM routes — all prefixed /crm/...
api_router.include_router(crm_tenants_router)
api_router.include_router(crm_companies_router)
api_router.include_router(crm_contacts_router)
api_router.include_router(crm_deals_router)
api_router.include_router(crm_activities_router)
api_router.include_router(crm_notes_router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
