from rest_framework.permissions import BasePermission, SAFE_METHODS

def user_role(user):
    # FIX: use user.userprofile instead of user.profile
    return getattr(getattr(user, "userprofile", None), "role", None)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and user_role(request.user) == "admin"


class IsWarden(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and user_role(request.user) == "warden"


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and user_role(request.user) == "student"


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


# Optional combined permissions if needed
class IsWardenOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_role(request.user) in ["warden", "admin"]
        )


class IsStudentOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and user_role(request.user) in ["student", "admin"]
        )
