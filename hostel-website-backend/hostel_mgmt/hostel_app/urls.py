from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeViewSet, RoomViewSet, AllocationViewSet, ComplaintViewSet,
    OutpassViewSet, AnnouncementViewSet, signup_user, mark_as_read
)

# DRF Router for ViewSets
router = DefaultRouter()
router.register(r"me", MeViewSet, basename="me")  # Profile of logged-in user
router.register(r"rooms", RoomViewSet, basename="rooms")
router.register(r"allocations", AllocationViewSet, basename="allocations")
router.register(r"complaints", ComplaintViewSet, basename="complaints")
router.register(r"outpasses", OutpassViewSet, basename="outpasses")
router.register(r"announcements", AnnouncementViewSet, basename="announcements")

urlpatterns = [
    path("", include(router.urls)),  # API root → http://127.0.0.1:8000/api/
    path("signup/", signup_user, name="signup"),
    path("<int:pk>/mark-read/", mark_as_read, name="mark-as-read"),
]
