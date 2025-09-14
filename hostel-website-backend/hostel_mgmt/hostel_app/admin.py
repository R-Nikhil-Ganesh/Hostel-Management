from django.contrib import admin
from .models import UserProfile, Room, Allocation, Complaint, Outpass, Announcement

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email")

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("room_number", "room_type", "capacity", "is_active", "current_occupancy")
    list_filter = ("room_type", "is_active")
    search_fields = ("room_number",)


admin.site.register(Allocation)
admin.site.register(Complaint)

@admin.register(Outpass)
class OutpassAdmin(admin.ModelAdmin):
    list_display = ("student", "from_date", "to_date", "status", "applied_at", "decided_at")
    list_filter = ("status", "applied_at")
    search_fields = ("student__user__username",)

admin.site.register(Announcement)

