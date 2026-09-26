"""Realistic demo data so a fresh deployment looks like a real workspace."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Comment, Priority, Project, Role, Task, TaskStatus, User

# The first member is replaced by the demo executor account, so it has tasks to see.
TEAM = [
    ("Ava Thompson", "ava.thompson@example.com"),
    ("Sofia Rossi", "sofia.rossi@example.com"),
    ("Noah Patel", "noah.patel@example.com"),
]

# project -> [(title, description, status, priority, assignee index, due in days)]
PROJECTS = [
    ("Website Redesign", "New marketing website for the Q4 product launch.", [
        ("Homepage wireframes", "Low-fidelity wireframes for desktop and mobile.", "done", "high", 0, -12),
        ("Design system tokens", "Colors, typography and spacing tokens in Figma.", "done", "medium", 1, -6),
        ("Implement responsive header", "Sticky header with a mobile menu.", "in_progress", "high", 2, 2),
        ("Pricing page copy", "Draft copy for three pricing tiers.", "in_progress", "medium", 1, 4),
        ("Lighthouse performance audit", "Target a 90+ performance score.", "todo", "medium", 2, 9),
        ("Cookie consent banner", "GDPR-compliant consent with preferences.", "todo", "urgent", 0, -1),
    ]),
    ("Mobile App MVP", "iOS/Android MVP for customer self-service.", [
        ("Auth flow with magic link", "Passwordless login via email.", "done", "high", 2, -8),
        ("Push notifications", "Order status notifications via FCM.", "in_progress", "urgent", 0, 1),
        ("Offline mode for orders", "Cache the last 50 orders locally.", "todo", "low", 2, 20),
        ("App Store screenshots", "Screenshots for all device sizes in 3 languages.", "todo", "medium", 1, 14),
        ("Crash reporting", "Integrate Sentry for both platforms.", "cancelled", "low", 0, None),
    ]),
    ("Q4 Marketing Campaign", "Paid and organic campaign for the holiday season.", [
        ("Audience research", "Define 3 target segments with personas.", "done", "medium", 1, -20),
        ("Ad creatives, round 1", "12 static and 4 video creatives.", "in_progress", "high", 1, 3),
        ("Landing page A/B test", "Test two hero variants for 2 weeks.", "todo", "high", 2, 6),
        ("Newsletter sequence", "5-email nurture sequence for new leads.", "todo", "medium", 0, 11),
    ]),
]

COMMENTS = {
    "Implement responsive header": [
        "Mobile breakpoint is done, testing Safari now.",
        "Looks great on iPhone 15 👍",
    ],
    "Push notifications": ["FCM keys are added to the staging project."],
    "Cookie consent banner": ["Legal approved the text — this blocks the release."],
}


def seed_demo_data(db: Session, owner: User) -> None:
    if db.scalar(select(Task.id).limit(1)):
        return
    team = []
    for name, email in TEAM:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                name=name, email=email, password_hash=hash_password("Demo12345!"), role=Role.executor
            )
            db.add(user)
        team.append(user)
    demo_executor = db.scalar(
        select(User).where(User.role == Role.executor, User.email.notin_([e for _, e in TEAM]))
    )
    if demo_executor is not None:
        team[0] = demo_executor
    db.flush()

    today = date.today()
    for project_name, project_description, tasks in PROJECTS:
        project = Project(name=project_name, description=project_description, owner_id=owner.id)
        db.add(project)
        db.flush()
        for title, description, status, priority, assignee, due in tasks:
            task = Task(
                title=title,
                description=description,
                status=TaskStatus(status),
                priority=Priority(priority),
                assignee_id=team[assignee].id,
                project_id=project.id,
                due_date=today + timedelta(days=due) if due is not None else None,
            )
            db.add(task)
            db.flush()
            for text in COMMENTS.get(title, []):
                db.add(Comment(task_id=task.id, user_id=owner.id, text=text))
    db.commit()
