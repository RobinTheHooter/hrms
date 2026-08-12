from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    HR = "hr"
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
