"""Prefilled candidate email templates. The recruiter edits before sending."""
from app.core.config import get_settings

settings = get_settings()


def build_templates(candidate, job) -> list[dict]:
    first_name = (candidate.full_name or "there").split()[0]
    role = job.title if job else "the role"
    sign = settings.EMAIL_FROM_NAME

    def t(key, label, subject, body):
        return {"key": key, "label": label, "subject": subject, "body": body}

    return [
        t(
            "application_received",
            "Application received",
            f"We've received your application — {role}",
            f"Hi {first_name},\n\nThanks for applying for the {role} position. "
            f"We've received your application and our team will review it shortly.\n\n"
            f"Best regards,\n{sign}",
        ),
        t(
            "shortlisted",
            "Shortlisted",
            f"You've been shortlisted — {role}",
            f"Hi {first_name},\n\nGood news! You've been shortlisted for the {role} "
            f"position. We'll be in touch soon with the next steps.\n\n"
            f"Best regards,\n{sign}",
        ),
        t(
            "interview",
            "Interview scheduled",
            f"Interview scheduled — {role}",
            f"Hi {first_name},\n\nWe'd like to invite you to an interview for the "
            f"{role} position. You'll receive a separate calendar invitation with "
            f"the date, time, and details.\n\nBest regards,\n{sign}",
        ),
        t(
            "next_round",
            "Next round",
            f"Next interview round — {role}",
            f"Hi {first_name},\n\nGreat news — you've progressed to the next round of "
            f"interviews for the {role} position. We'll follow up shortly with the "
            f"details for the next round.\n\nBest regards,\n{sign}",
        ),
        t(
            "on_hold",
            "On hold",
            f"Update on your application — {role}",
            f"Hi {first_name},\n\nThank you for interviewing for the {role} position. "
            f"Your application is currently on hold while we finalise our decision. "
            f"We'll be in touch as soon as we have an update.\n\nBest regards,\n{sign}",
        ),
        t(
            "offer",
            "Offer",
            f"Job offer — {role}",
            f"Hi {first_name},\n\nCongratulations! We're delighted to offer you the "
            f"{role} position. Our team will reach out with the formal offer "
            f"details.\n\nWarm regards,\n{sign}",
        ),
        t(
            "rejected",
            "Not moving forward",
            f"Update on your application — {role}",
            f"Hi {first_name},\n\nThank you for your interest in the {role} position "
            f"and for the time you invested. After careful consideration, we won't "
            f"be moving forward at this time. We wish you the very best and "
            f"encourage you to apply for future openings.\n\nBest regards,\n{sign}",
        ),
    ]
