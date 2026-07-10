"""Report routes for copyable FIFA World Cup 2026 operations summaries."""

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import limiter
from app.core.config import settings
from app.models.report import OperationsSummaryRequest, OperationsSummaryResponse
from app.services.report_service import report_service


router = APIRouter()


@router.post("/operations-summary", response_model=OperationsSummaryResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_operations_summary(
    request: Request,
    operations_summary_request: OperationsSummaryRequest,
) -> OperationsSummaryResponse:
    """Create a structured operations summary and Markdown report.

    Args:
        request: FastAPI request object required by slowapi.
        operations_summary_request: Validated report request payload.

    Returns:
        Operations summary response.
    """
    _ = request
    try:
        return report_service.generate_operations_summary(operations_summary_request)
    except ValueError as report_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium or scenario was not found. Please select valid FIFA World Cup 2026 inputs.",
        ) from report_error
