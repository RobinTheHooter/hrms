"""Default onboarding checklist, instantiated for every new hire.

Each entry is (category, title, owner). Timelines are set relative to the
start date by the service when the checklist is created.
"""
from app.common.enums import OnboardingTaskCategory as Cat
from app.common.enums import OnboardingTaskOwner as Owner

DEFAULT_CHECKLIST: list[tuple[Cat, str, Owner]] = [
    # Documentation
    (Cat.DOCUMENTATION, "Signed offer letter uploaded", Owner.PEOPLE_OPS),
    (Cat.DOCUMENTATION, "PAN & Aadhaar submitted", Owner.NEW_HIRE),
    (Cat.DOCUMENTATION, "Bank details for payroll", Owner.NEW_HIRE),
    (Cat.DOCUMENTATION, "Education & experience certificates", Owner.NEW_HIRE),
    # HR & Compliance
    (Cat.HR_COMPLIANCE, "NDA & confidentiality agreement signed", Owner.NEW_HIRE),
    (Cat.HR_COMPLIANCE, "PF & ESI enrolment", Owner.PEOPLE_OPS),
    (Cat.HR_COMPLIANCE, "Background verification", Owner.PEOPLE_OPS),
    (Cat.HR_COMPLIANCE, "Employee handbook acknowledgement", Owner.NEW_HIRE),
    # IT & Access
    (Cat.IT_ACCESS, "Company email & Google Workspace", Owner.IT),
    (Cat.IT_ACCESS, "Slack & project tool invites", Owner.IT),
    (Cat.IT_ACCESS, "Laptop / workstation provisioned", Owner.IT),
    (Cat.IT_ACCESS, "VPN & systems access", Owner.IT),
    (Cat.IT_ACCESS, "ID card & building access", Owner.IT),
    # Orientation & Manager
    (Cat.ORIENTATION, "Day-1 orientation & office tour", Owner.PEOPLE_OPS),
    (Cat.ORIENTATION, "30-60-90 day plan & first project brief", Owner.MANAGER),
]
