
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q

from .models import (
    UserProfile, Room, Allocation, Complaint, Outpass, Announcement, 
    AllowedStudent
)

User = get_user_model()

# --- ALLOWED STUDENT ---
class AllowedStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedStudent
        fields = '__all__'


# --- USER ---
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
        fields = ["id", "role", "outpass_updates", "room_announcements", "maintenance_alerts", "email_notifications"]


# --- PASSWORD CHANGE ---
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


# --- ROOMS ---
class RoomSerializer(serializers.ModelSerializer):
    current_occupancy = serializers.IntegerField(read_only=True)

    class Meta:
        model = Room
        fields = [
            "id", "room_number", "room_type", "block", "floor", "capacity",
            "monthly_rent", "has_ac", "has_wifi", "has_study_table", "has_wardrobe",
            "has_balcony", "has_attached_washroom", "is_active", "current_occupancy"
        ]
        read_only_fields = ["current_occupancy"]


class RoomDetailSerializer(RoomSerializer):
    students = serializers.SerializerMethodField()

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ["students"]

    def get_students(self, obj):
        profiles = UserProfile.objects.filter(room=obj)
        return [{"id": p.id, "name": p.user.get_full_name() or p.user.username} for p in profiles]


# --- ALLOCATIONS ---
class AllocationSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all(), source="room", write_only=True)
    student_email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = Allocation
        fields = ["id", "student", "student_email", "room", "room_id", "start_date", "end_date"]
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

        overlapping = Allocation.objects.filter(room=room, end_date__gte=start, start_date__lte=end).count()
        if overlapping >= room.capacity:
            raise serializers.ValidationError("Room is already at full capacity for these dates.")

        return data

    def create(self, validated_data):
        req = self.context["request"]
        profile = getattr(req.user, "userprofile", None)
        if profile and profile.role == "student":
            validated_data["student"] = profile
        elif not req.user.is_staff and "student" not in validated_data:
            raise serializers.ValidationError("Not authorized to create allocation.")
        return super().create(validated_data)


# --- COMPLAINTS ---
class ComplaintSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source="student.user.email", read_only=True)
    student_room = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id", "student", "student_email", "student_room", "title", "description",
            "category", "category_display", "status", "status_display",
            "priority", "priority_display", "created_at", "updated_at"
        ]
        read_only_fields = ["student", "created_at", "updated_at"]

    def get_student_room(self, obj):
        today = timezone.now().date()
        alloc = obj.student.allocations.filter(
            Q(end_date__gte=today) | Q(end_date__isnull=True)
        ).order_by("-start_date").first()
        return alloc.room.room_number if alloc and alloc.room else None


# --- OUTPASSES ---
class OutpassSerializer(serializers.ModelSerializer):
    student_email = serializers.EmailField(source="student.user.email", read_only=True)

    class Meta:
        model = Outpass
        fields = ["id", "student", "student_email", "reason", "from_date", "to_date", "status", "description", "applied_at"]
        read_only_fields = ["student", "status", "applied_at"]

    def create(self, validated_data):
        req = self.context["request"]
        prof = getattr(req.user, "userprofile", None)
        if prof and prof.role == "student":
            validated_data["student"] = prof
        return super().create(validated_data)


# --- ANNOUNCEMENTS ---
class AnnouncementSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ["id", "title", "message", "priority", "category", "created_at", "is_read"]

    def get_is_read(self, obj):
        prof = getattr(self.context["request"].user, "userprofile", None)
        return obj.read_by.filter(id=prof.id).exists() if prof else False


# --- FEES ---
class FeeStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["fee_status"]


# --- STUDENTS (list + create) ---
class StudentSerializer(serializers.ModelSerializer):
    fee_status = serializers.SerializerMethodField(read_only=True)
    current_room = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "fee_status", "current_room"]

    def get_fee_status(self, obj):
        profile = getattr(obj, "userprofile", None)
        if not profile:
            return None

        # get active allocation
        alloc = Allocation.objects.filter(student=profile, end_date__isnull=True).first()
        if not alloc:
            return profile.fee_status

        # calculate due date
        if alloc.start_date:
            due_date = alloc.start_date + timezone.timedelta(days=31)
            if profile.fee_status != "paid" and timezone.now().date() > due_date:
                return "overdue"

        # return actual fee_status from DB
        return profile.fee_status

    def get_current_room(self, obj):
        profile = getattr(obj, "userprofile", None)
        if not profile:
            return None
        alloc = Allocation.objects.filter(student=profile, end_date__isnull=True).select_related("room").first()
        return alloc.room.room_number if alloc and alloc.room else None



class StudentCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]

        # Create User
        user = User.objects.create_user(username=email, email=email)

        # Create or get UserProfile (avoid UNIQUE constraint errors)
        profile, created = UserProfile.objects.get_or_create(user=user, defaults={"role": "student"})

        # Create Fee Account (if not already present)
        from fees.models import StudentFeeAccount
        StudentFeeAccount.objects.get_or_create(student=profile)

        return user

class MeSerializer(serializers.ModelSerializer):
    fee_status = serializers.SerializerMethodField()
    current_room = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "fee_status", "current_room"]

    def get_fee_status(self, obj):
        profile = getattr(obj, "userprofile", None)
        return profile.fee_status if profile else None

    def get_current_room(self, obj):
        profile = getattr(obj, "userprofile", None)
        if not profile:
            return None
        alloc = Allocation.objects.filter(student=profile, end_date__isnull=True).select_related("room").first()
        return alloc.room.room_number if alloc and alloc.room else None

