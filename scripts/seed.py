"""Seed the database with a default admin user and sample employees.

Run from the backend directory (after `alembic upgrade head`):

    python -m scripts.seed

Idempotent: existing rows (matched by email) are skipped.
"""

import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app.common.enums import EmployeeStatus, EmploymentType, UserRole
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.models import User
from app.modules.employees.models import Employee

DEFAULT_ADMIN = {
    "email": "admin@hrms.local",
    "password": "admin1234",
    "full_name": "Dev Admin",
    "role": UserRole.ADMIN,
}

SAMPLE_EMPLOYEES = [
    ("Aarav", "Sharma", "aarav.sharma@hrms.local", "Backend Engineer", "Engineering", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2022, 3, 14), "1450000"),
    ("Diya", "Patel", "diya.patel@hrms.local", "Product Designer", "Design", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2021, 7, 1), "1250000"),
    ("Kabir", "Singh", "kabir.singh@hrms.local", "Engineering Manager", "Engineering", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2019, 11, 20), "2600000"),
    ("Ananya", "Rao", "ananya.rao@hrms.local", "HR Generalist", "People", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2023, 1, 9), "900000"),
    ("Vivaan", "Gupta", "vivaan.gupta@hrms.local", "Data Analyst", "Analytics", EmploymentType.FULL_TIME, EmployeeStatus.PROBATION, date(2024, 6, 3), "1100000"),
    ("Isha", "Nair", "isha.nair@hrms.local", "Frontend Engineer", "Engineering", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2022, 9, 12), "1400000"),
    ("Arjun", "Mehta", "arjun.mehta@hrms.local", "Sales Executive", "Sales", EmploymentType.FULL_TIME, EmployeeStatus.ON_LEAVE, date(2020, 4, 27), "850000"),
    ("Saanvi", "Iyer", "saanvi.iyer@hrms.local", "QA Engineer", "Engineering", EmploymentType.CONTRACT, EmployeeStatus.ACTIVE, date(2023, 8, 15), "950000"),
    ("Reyansh", "Joshi", "reyansh.joshi@hrms.local", "DevOps Engineer", "Platform", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2021, 2, 18), "1600000"),
    ("Myra", "Verma", "myra.verma@hrms.local", "Marketing Intern", "Marketing", EmploymentType.INTERN, EmployeeStatus.ACTIVE, date(2025, 1, 6), "300000"),
    ("Aditya", "Kulkarni", "aditya.kulkarni@hrms.local", "Finance Analyst", "Finance", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2020, 10, 5), "1200000"),
    ("Sara", "Khan", "sara.khan@hrms.local", "Recruiter", "People", EmploymentType.PART_TIME, EmployeeStatus.ACTIVE, date(2023, 5, 22), "600000"),
    ("Ishaan", "Reddy", "ishaan.reddy@hrms.local", "Support Lead", "Customer Success", EmploymentType.FULL_TIME, EmployeeStatus.TERMINATED, date(2018, 6, 30), "1050000"),
    ("Kiara", "Bose", "kiara.bose@hrms.local", "Content Strategist", "Marketing", EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2022, 12, 1), "980000"),
]


async def seed_admin(session) -> None:
    exists = await session.scalar(select(User).where(User.email == DEFAULT_ADMIN["email"]))
    if exists:
        print(f"  = admin {DEFAULT_ADMIN['email']} already exists")
        return
    session.add(
        User(
            email=DEFAULT_ADMIN["email"],
            hashed_password=hash_password(DEFAULT_ADMIN["password"]),
            full_name=DEFAULT_ADMIN["full_name"],
            role=DEFAULT_ADMIN["role"],
        )
    )
    print(f"  + created admin {DEFAULT_ADMIN['email']} (password: {DEFAULT_ADMIN['password']})")


async def seed_employees(session) -> None:
    for (first, last, email, title, dept, etype, status, doj, salary) in SAMPLE_EMPLOYEES:
        exists = await session.scalar(select(Employee).where(Employee.email == email))
        if exists:
            continue
        session.add(
            Employee(
                first_name=first,
                last_name=last,
                email=email,
                job_title=title,
                department=dept,
                employment_type=etype,
                status=status,
                date_of_joining=doj,
                salary=Decimal(salary),
            )
        )
    print(f"  + ensured {len(SAMPLE_EMPLOYEES)} sample employees")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await seed_admin(session)
        await seed_employees(session)
        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
