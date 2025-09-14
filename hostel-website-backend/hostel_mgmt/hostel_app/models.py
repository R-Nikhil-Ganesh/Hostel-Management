from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

User = settings.AUTH_USER_MODEL

from django.db import models

# Choices for roles
ROLE_CHOICES = [
    ('student', 'Student'),
    ('warden', 'Warden'),
    ('admin', 'Admin'),
]

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_contact = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Notification Preferences
    outpass_updates = models.BooleanField(default=True)
    room_announcements = models.BooleanField(default=True)
    maintenance_alerts = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"



class Room(models.Model):
    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=20)  # single / double
    block = models.CharField(max_length=20, default="A")
    floor = models.PositiveIntegerField(default=1)
    monthly_rent = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    # facilities
    has_ac = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)
    has_study_table = models.BooleanField(default=False)
    has_wardrobe = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_attached_washroom = models.BooleanField(default=False)

    capacity = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    is_under_maintenance = models.BooleanField(default=False)
    maintenance_issue = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.room_number} ({self.room_type})"
    
    @property
    def capacity(self):
        """Capacity derived from room_type (or you can store as a field)."""
        return 1 if self.room_type == "Single" else 2

    @property
    def current_occupancy(self):
        return Allocation.objects.filter(room=self, end_date__isnull=True).count()

    @property
    def roommates(self):
        """List all active students in this room"""
        return UserProfile.objects.filter(
            allocations__room=self,
            allocations__end_date__isnull=True
        )


class Allocation(models.Model):
    student = models.ForeignKey(
        "UserProfile",
        on_delete=models.CASCADE,
        related_name="allocations"
    )
    room = models.ForeignKey(
        "Room",
        on_delete=models.CASCADE,
        related_name="allocations"
    )
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)  # None = still active
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student"],
                condition=models.Q(end_date__isnull=True),
                name="unique_active_allocation_per_student"
            )
        ]

    def clean(self):
        """Prevent overbooking beyond room capacity."""
        active_count = Allocation.objects.filter(
            room=self.room,
            end_date__isnull=True
        ).exclude(pk=self.pk).count()

        if active_count >= self.room.capacity:
            raise ValidationError("Room is already at full capacity.")

    def __str__(self):
        return f"{self.student.user.username} -> {self.room.room_number}"



class Complaint(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]


    CATEGORY_CHOICES = [
        ("Plumbing", "Plumbing"),
        ("Electricity", "Electricity"),
        ("Food", "Food"),
        ("Other", "Other"),
    ]

    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="complaints")
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="Other")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

# Outpass model
class Outpass(models.Model):
    STATUS = [("Pending", "Pending"), ("Approved", "Approved"), ("Rejected", "Rejected")]
    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="outpasses")
    reason = models.TextField()
    from_date = models.DateField()
    to_date = models.DateField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="Pending")
    applied_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    warden_comment = models.TextField(blank=True, default="")

    def __str__(self):
        return f"Outpass {self.student} {self.from_date}→{self.to_date} [{self.status}]"


class Announcement(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    CATEGORY_CHOICES = [
        ("general", "General"),
        ("maintenance", "Maintenance"),
        ("food", "Food"),
        ("facilities", "Facilities"),
        ("inspection", "Inspection"),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="general")
    created_at = models.DateTimeField(auto_now_add=True)

    # Instead of a single `read_status`, we’ll track which users have read it
    read_by = models.ManyToManyField(UserProfile, related_name="read_announcements", blank=True)

    def __str__(self):
        return self.title
