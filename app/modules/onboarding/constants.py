"""Human labels for onboarding enums, used in emails and digests.

Ordered to match the checklist's display order (documentation first).
"""

# category value -> label (insertion order = display order)
CATEGORY_LABELS: dict[str, str] = {
    "documentation": "Documentation",
    "hr_compliance": "HR & Compliance",
    "it_access": "IT & Access",
    "orientation": "Orientation & Manager",
}

# owner value -> label
OWNER_LABELS: dict[str, str] = {
    "people_ops": "People Ops",
    "it": "IT",
    "manager": "Manager",
    "new_hire": "New hire",
}
