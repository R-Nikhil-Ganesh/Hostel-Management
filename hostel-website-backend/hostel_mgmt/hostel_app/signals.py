from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import UserProfile, Allocation, StudentCharge

User = get_user_model()

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created and not hasattr(instance, "profile"):
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()

@receiver(post_save, sender=Allocation)
def create_one_time_charge_for_allocation(sender, instance: Allocation, created, **kwargs):
    """
    When an allocation is first created, create a single StudentCharge
    for the room's monthly_rent. If you re-create allocations or update,
    this function will not create duplicates because we check for an existing charge
    for this allocation with same amount & no due_date (or you can change the dedupe rule).
    """
    if not created:
        return

    try:
        student = instance.student
        room = instance.room
        amount = getattr(room, "monthly_rent", 0) or 0

        # Avoid duplicate: check if a charge already exists for this allocation & amount
        exists = StudentCharge.objects.filter(allocation=instance, amount=amount).exists()
        if exists:
            return

        # due_date set to allocation.start_date by default (or None)
        due_date = instance.start_date or timezone.now().date()

        StudentCharge.objects.create(
            student=student,
            allocation=instance,
            description=f"One-time charge for room {room.room_number}",
            amount=amount,
            due_date=due_date,
            status="pending",
        )
    except Exception:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("Failed to create one-time charge for allocation %s", getattr(instance, "id", None))