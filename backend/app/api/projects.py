from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Project, Role
from app.schemas import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    user=Depends(require_roles(Role.admin, Role.manager, Role.executor)),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(Project).order_by(Project.id.desc())))


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    data: ProjectCreate,
    user=Depends(require_roles(Role.admin, Role.manager)),
    db: Session = Depends(get_db),
):
    p = Project(**data.model_dump(), owner_id=user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectCreate,
    user=Depends(require_roles(Role.admin, Role.manager)),
    db: Session = Depends(get_db),
):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    if user.role != Role.admin and p.owner_id != user.id:
        raise HTTPException(403, "Only project owner can edit")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    user=Depends(require_roles(Role.admin, Role.manager)),
    db: Session = Depends(get_db),
):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    if user.role != Role.admin and p.owner_id != user.id:
        raise HTTPException(403, "Only project owner can delete")
    db.delete(p)
    db.commit()
