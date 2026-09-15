from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    HR = "hr"
    CONSULTANT = "consultant"
    HIRING_MANAGER = "hiring_manager"
    CANDIDATE = "candidate"
    # Legacy roles (kept so existing enum values remain valid).
    MANAGER = "manager"
    EMPLOYEE = "employee"


class EmploymentType(StrEnum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"


class EmployeeStatus(StrEnum):
    ACTIVE = "active"
    PROBATION = "probation"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class JobStatus(StrEnum):
    OPEN = "open"
    CLOSED = "closed"


class CandidateSource(StrEnum):
    APPLIED = "applied"
    REFERRAL = "referral"
    SOURCED = "sourced"
    AGENCY = "agency"


class CandidateStage(StrEnum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"


class InterviewMode(StrEnum):
    VIRTUAL = "virtual"
    WALK_IN = "walk_in"


class InterviewStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InterviewOutcome(StrEnum):
    PENDING = "pending"
    SELECTED = "selected"
    REJECTED = "rejected"


class Priority(StrEnum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class OfferStatus(StrEnum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    WITHDRAWN = "withdrawn"


class OnboardingStatus(StrEnum):
    PRE_JOINING = "pre_joining"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OnboardingTaskCategory(StrEnum):
    DOCUMENTATION = "documentation"
    HR_COMPLIANCE = "hr_compliance"
    IT_ACCESS = "it_access"
    ORIENTATION = "orientation"


class OnboardingTaskStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class OnboardingTaskOwner(StrEnum):
    PEOPLE_OPS = "people_ops"
    IT = "it"
    MANAGER = "manager"
    NEW_HIRE = "new_hire"
