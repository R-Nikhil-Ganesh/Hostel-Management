from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeViewSet, RoomViewSet, AllocationViewSet, ComplaintViewSet,
    OutpassViewSet, AnnouncementViewSet, signup_user, mark_as_read, FeeStructureViewSet,
    StudentFeeAccountViewSet, StudentChargeViewSet, PaymentViewSet, fees_summary, StudentListView, StudentCreateView, StudentUpdateView
)

# DRF Router for ViewSets
router = DefaultRouter()
router.register(r"me", MeViewSet, basename="me")  # Profile of logged-in user
router.register(r"rooms", RoomViewSet, basename="rooms")
router.register(r"allocations", AllocationViewSet, basename="allocations")
router.register(r"complaints", ComplaintViewSet, basename="complaints")
router.register(r"outpasses", OutpassViewSet, basename="outpasses")
router.register(r"announcements", AnnouncementViewSet, basename="announcements")
router.register(r"fees/structures", FeeStructureViewSet, basename="fees-structure")
router.register(r"fees/accounts", StudentFeeAccountViewSet, basename="fees-account")
router.register(r"fees/charges", StudentChargeViewSet, basename="fees-charge")
router.register(r"fees/payments", PaymentViewSet, basename="fees-payment")

urlpatterns = [
    path("", include(router.urls)),  # API root → http://127.0.0.1:8000/api/
    path("signup/", signup_user, name="signup"),
    path("<int:pk>/mark-read/", mark_as_read, name="mark-as-read"),
    path("fees/summary/", fees_summary, name="fees-summary"),
    path("students/", StudentListView.as_view(), name="student-list"),
    path("students/add/", StudentCreateView.as_view(), name="student-add"),
    path("students/<int:pk>/update/", StudentUpdateView.as_view(), name="student-update"),
]
