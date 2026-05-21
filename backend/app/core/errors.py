import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(OperationalError)
    async def database_operational_error_handler(request: Request, exc: OperationalError):
        logger.exception("Database operation failed for %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Database is unavailable. Check database connectivity and retry.",
                "code": "database_unavailable",
            },
        )
