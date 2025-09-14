# serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q

from .models import UserProfile, Room, Allocation, Complaint, Outpass, Announcement

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]

    def get_role(self, obj):
        return getattr(getattr(obj, "userprofile", None), "role", None)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "role",
            "outpass_updates",
            "room_announcements",
            "maintenance_alerts",
            "email_notifications",
        ]


# ComplaintSerializer for Complaint model
class ComplaintSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source="student.user.email", read_only=True)
    student_room = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id",
            "student",
            "student_email",
            "student_room",
            "title",
            "description",
            "category",
            "category_display",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["student", "created_at", "updated_at"]

    def get_student_room(self, obj):
        """
        Return the student's current room number (if any). We consider current allocations
        those with end_date >= today OR end_date is null.
        """
        try:
            # `allocations` is assumed to be the related_name on Allocation.student FK.
            # If your related_name is different, change `.allocations` accordingly.
            today = timezone.now().date()
            allocation = (
                obj.student.allocations
                .filter(Q(end_date__gte=today) | Q(end_date__isnull=True))
                .order_by("-start_date")
                .first()
            )
            if allocation and allocation.room:
                return allocation.room.room_number
        except Exception:
            # defensive: return None if anything goes wrong (missing relation, etc.)
            return None
        return None


# 🔹 For password change
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class RoomSerializer(serializers.ModelSerializer):
    current_occupancy = serializers.IntegerField(read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "room_number",
            "room_type",
            "block",
            "floor",
            "capacity",
            "monthly_rent",
            "has_ac",
            "has_wifi",
            "has_study_table",
            "has_wardrobe",
            "has_balcony",
            "has_attached_washroom",
            "is_active",
            "current_occupancy",
        ]
        read_only_fields = ["current_occupancy"]


class RoomDetailSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()
    current_occupancy = serializers.IntegerField(read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "room_number",
            "room_type",
            "block",
            "floor",
            "capacity",
            "monthly_rent",
            "has_ac",
            "has_wifi",
            "has_study_table",
            "has_wardrobe",
            "has_balcony",
            "has_attached_washroom",
            "is_active",
            "current_occupancy",
            "students",
        ]
        read_only_fields = ["current_occupancy"]

    def _student_display_name(self, profile):
        user = getattr(profile, "user", None)
        if user:
            name = getattr(user, "get_full_name", None)
            if callable(name):
                name = name()
            if name:
                return name
            if getattr(user, "username", None):
                return user.username
        if getattr(profile, "name", None):
            return profile.name
        return f"user-{getattr(profile, 'id', 'unknown')}"

    def get_students(self, obj):
        if hasattr(obj, "students"):
            profiles = obj.students.all()
        else:
            try:
                profiles = UserProfile.objects.filter(room=obj)
            except Exception:
                profiles = []
        return [{"id": getattr(p, "id", None), "name": self._student_display_name(p)} for p in profiles]


# --- Combined AllocationSerializer ---
class AllocationSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all(), source="room", write_only=True)
    student_email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = Allocation
        fields = [
            "id",
            "student",
            "student_email",
            "room",
            "room_id",
            "start_date",
            "end_date",
        ]
        read_only_fields = ["student"]

    def validate(self, data):
        email = data.pop("student_email", None)

        if email:
            try:
                user = User.objects.get(email=email)
                data["student"] = user.userprofile
            except User.DoesNotExist:
                raise serializers.ValidationError({"student_email": "No user with this email"})

        room = data.get("room")
        start = data.get("start_date")
        end = data.get("end_date") or timezone.now().date()

        # Capacity check
        overlapping = Allocation.objects.filter(room=room, end_date__gte=start, start_date__lte=end).count()
        if overlapping >= room.capacity:
            raise serializers.ValidationError("Room is already at full capacity for these dates.")

        return data

    def create(self, validated_data):
        request = self.context["request"]
        profile = getattr(request.user, "userprofile", None)

        if profile and profile.role == "student":
            validated_data["student"] = profile
        elif not request.user.is_staff and "student" not in validated_data:
            raise serializers.ValidationError("You are not authorized to create an allocation.")

        return super().create(validated_data)


class OutpassSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source="student.user.email", read_only=True)

    class Meta:
        model = Outpass
        fields = [
            "id",
            "student",
            "student_email",   # 👈 new field
            "reason",
            "from_date",
            "to_date",
            "status",
            "description",
            "applied_at",
        ]
        read_only_fields = ["student", "status", "applied_at"]

    def create(self, validated_data):
        req = self.context["request"]
        prof = getattr(req.user, "userprofile", None)
        if prof and prof.role == "student":
            validated_data["student"] = prof
        return super().create(validated_data)



class AnnouncementSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ["id", "title", "message", "priority", "category", "created_at", "is_read"]

    def get_is_read(self, obj):
        user = self.context["request"].user
        prof = getattr(user, "userprofile", None)
        if prof:
            return obj.read_by.filter(id=prof.id).exists()
        return False
