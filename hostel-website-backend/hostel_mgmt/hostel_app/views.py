from django.utils import timezone
from django.contrib.auth import get_user_model, update_session_auth_hash
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import Room, Allocation, Complaint,  Outpass, Announcement, UserProfile
from .serializers import (
    UserSerializer, RoomSerializer, AllocationSerializer, ComplaintSerializer,
    OutpassSerializer, AnnouncementSerializer,
    UserProfileSerializer, PasswordChangeSerializer, RoomDetailSerializer
)
from .permissions import IsAdmin, IsWarden, IsStudent, IsWardenOrAdmin

User = get_user_model()


# ---------------- ME ----------------
class MeViewSet(viewsets.ViewSet):
    def list(self, request):
        return response.Response(UserSerializer(request.user).data)


# ---------------- ROOMS ----------------
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by("room_number")
    serializer_class = RoomSerializer

    # Keep your existing get_permissions logic (but ensure it's returning a single combined permission when needed)
    def get_permissions(self):
        # example: safe read for anyone, write for admin/warden (you can change this)
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsWardenOrAdmin()]   # instances here
        return [permissions.IsAuthenticated()] 

    @decorators.action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="mine")
    def mine(self, request):
        """
        Return the room assigned to the current user (if any).
        Handles two patterns:
         - UserProfile has a FK `room`
         - Room has a ManyToMany `students`
        """
        prof = getattr(request.user, "userprofile", None)

        room = None
        if prof:
            # CASE 1: profile has direct FK to room
            room = getattr(prof, "room", None)

        if room is None:
            # CASE 2: Room has students M2M -> try to find room containing this profile
            try:
                if prof:
                    room = Room.objects.filter(students=prof).first()
            except Exception:
                room = None

        if not room:
            return response.Response({"detail": "No room assigned"}, status=status.HTTP_404_NOT_FOUND)

        serializer = RoomDetailSerializer(room, context={"request": request})
        return response.Response(serializer.data)

# ---------------- ALLOCATION ----------------
class AllocationViewSet(viewsets.ModelViewSet):
    serializer_class = AllocationSerializer

    def get_queryset(self):
        prof = getattr(self.request.user, "userprofile", None)
        if prof and prof.role == "student":
            # Only active allocation for the student
            return Allocation.objects.filter(student=prof, end_date__isnull=True)
        # Admins/Wardens see all
        return Allocation.objects.all().order_by('-start_date')

    def get_permissions(self):
        prof = getattr(self.request.user, "userprofile", None)
        if self.action in ["create", "update", "partial_update", "destroy"]:
            # Only admin/warden can manage allocations
            if prof and prof.role in ["admin", "warden"]:
                return [IsWardenOrAdmin()]  # fallback
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]


    @decorators.action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def my_room(self, request):
        prof = getattr(request.user, "userprofile", None)
        if not prof or prof.role != "student":
            return response.Response({"detail": "Only students have rooms."}, status=403)

        try:
            allocation = Allocation.objects.get(student=prof, end_date__isnull=True)
        except Allocation.DoesNotExist:
            return response.Response({"detail": "No active room allocation."}, status=404)

        return response.Response(AllocationSerializer(allocation, context={"request": request}).data)



# ---------------- COMPLAINTS ----------------
class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        prof = getattr(self.request.user, "userprofile", None)
        if prof and prof.role == "student":
            return Complaint.objects.filter(student=prof).order_by("-created_at")
        elif prof and prof.role in ["warden", "admin"]:
            return Complaint.objects.all().order_by("-created_at")
        return Complaint.objects.none()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.userprofile)

    @decorators.action(methods=["post"], detail=True, permission_classes=[IsWarden])
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(Complaint.STATUS_CHOICES):
            return response.Response({"error": "Invalid status"}, status=400)

        complaint.status = new_status
        complaint.save()
        return response.Response({"status": complaint.status})

# ---------------- OUTPASS ----------------
class OutpassViewSet(viewsets.ModelViewSet):
    serializer_class = OutpassSerializer
    permission_classes = [IsAuthenticated]  # base rule

    def get_queryset(self):
        prof = getattr(self.request.user, "userprofile", None)
        print("DEBUG: logged in as", self.request.user, "role=", getattr(prof, "role", None))
        if prof and prof.role == "student":
            return Outpass.objects.filter(student=prof).order_by("-applied_at")
        elif prof and prof.role in ["warden", "admin"]:
            return Outpass.objects.all().order_by("-applied_at")
        return Outpass.objects.none()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user.userprofile)

    @decorators.action(methods=["post"], detail=True, permission_classes=[IsWardenOrAdmin])
    def approve(self, request, pk=None):
        out = self.get_object()
        out.status = "approved"
        out.decided_at = timezone.now()
        out.warden_comment = request.data.get("comment", "")
        out.save()
        return response.Response({"status": "approved"})

    @decorators.action(methods=["post"], detail=True, permission_classes=[IsWardenOrAdmin])
    def reject(self, request, pk=None):
        out = self.get_object()
        out.status = "rejected"
        out.decided_at = timezone.now()
        out.warden_comment = request.data.get("comment", "")
        out.save()
        return response.Response({"status": "rejected"})

# ---------------- ANNOUNCEMENTS ----------------
class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.all().order_by("-created_at")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsWardenOrAdmin()]
        return super().get_permissions()

    @decorators.action(methods=["post"], detail=True)
    def mark_read(self, request, pk=None):
        announcement = self.get_object()
        prof = getattr(request.user, "userprofile", None)
        if prof:
            announcement.read_by.add(prof)
            return response.Response({"status": "marked as read"})
        return response.Response({"error": "Invalid user"}, status=400)

    @decorators.action(methods=["post"], detail=True)
    def mark_unread(self, request, pk=None):
        announcement = self.get_object()
        prof = getattr(request.user, "userprofile", None)
        if prof:
            announcement.read_by.remove(prof)
            return response.Response({"status": "marked as unread"})
        return response.Response({"error": "Invalid user"}, status=400)


# ---------------- USER PROFILES ----------------
class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    queryset = UserProfile.objects.all()

    def get_queryset(self):
        prof = getattr(self.request.user, "userprofile", None)
        if prof and prof.role in ["warden", "admin"]:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)

    @decorators.action(detail=False, methods=["patch"])
    def update_preferences(self, request):
        prof = request.user.userprofile
        serializer = self.get_serializer(prof, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data)
        return response.Response(serializer.errors, status=400)

    @decorators.action(detail=False, methods=["post"])
    def change_password(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["old_password"]):
                return response.Response({"old_password": "Incorrect password"}, status=400)
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            update_session_auth_hash(request, user)
            return response.Response({"status": "password updated"})
        return response.Response(serializer.errors, status=400)

@csrf_exempt
def signup_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        role = data.get("role")  # no default!

        if not username or not email or not password or not role:
            return JsonResponse({"error": "Missing fields"}, status=400)

        if role not in ["student", "warden", "admin"]:
            return JsonResponse({"error": "Invalid role"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "Email already exists"}, status=400)

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)

        # Assign role
        profile = user.userprofile
        profile.role = role
        profile.save()

        return JsonResponse({
            "message": "User created successfully",
            "username": user.username,
            "email": user.email,
            "role": profile.role
        })

    return JsonResponse({"error": "Invalid request"}, status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_as_read(request, pk):
    try:
        announcement = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        return response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    profile = getattr(request.user, "profile", None)
    if profile:
        announcement.read_by.add(profile)
        return response({"message": "Marked as read"}, status=status.HTTP_200_OK)

    return response({"error": "No profile linked"}, status=status.HTTP_400_BAD_REQUEST)