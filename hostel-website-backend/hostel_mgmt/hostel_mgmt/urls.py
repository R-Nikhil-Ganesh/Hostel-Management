"""
Project-level URL configuration for hostel_mgmt.

Routes:
- /                     → Welcome message
- /admin/               → Django admin
- /api/token/           → JWT access + refresh token pair
- /api/token/refresh/   → Refresh JWT
- /api/v1/              → Hostel app API routes
- /api-auth/            → DRF browsable API login/logout
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse


# 👇 Root API welcome page
def api_home(request):
    return JsonResponse({"message": "Welcome to Hostel Management API"})


urlpatterns = [
    path("", api_home, name="home"),  # root `/`
    path("admin/", admin.site.urls),

    # JWT Authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # API routes
    path("api/v1/", include("hostel_app.urls")),

    # Optional: browsable API login/logout
    path("api-auth/", include("rest_framework.urls")),
]
