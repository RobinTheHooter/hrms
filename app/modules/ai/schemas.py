from pydantic import BaseModel, Field


class InterviewQuestionsRequest(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    skills: str | None = None
    seniority: str | None = None
    focus: str | None = None


class InterviewQuestionsResponse(BaseModel):
    technical: list[str] = []
    behavioral: list[str] = []


class EmailDraftRequest(BaseModel):
    # e.g. "outreach", "rejection", "offer_nudge", "custom"
    kind: str = Field(min_length=1, max_length=50)
    candidate_name: str | None = Field(default=None, max_length=200)
    role: str | None = Field(default=None, max_length=150)
    tone: str | None = Field(default=None, max_length=60)
    notes: str | None = None


class EmailDraftResponse(BaseModel):
    subject: str
    body: str


class ScreeningInsightsRequest(BaseModel):
    candidate_id: int


class ScreeningInsightsResponse(BaseModel):
    rationale: str
    strengths: list[str] = []
    gaps: list[str] = []
    follow_up_questions: list[str] = []
