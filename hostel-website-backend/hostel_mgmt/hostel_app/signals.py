from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile, Allocation

User = get_user_model()

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created and not hasattr(instance, "profile"):
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()


@receiver(post_save, sender=Allocation)
def update_fee_status_on_allocation(sender, instance, created, **kwargs):
    if created and instance.student:
        profile = instance.student
        if profile.role == "student":
            # Only set if not already marked
            if not profile.fee_status or profile.fee_status == "paid":
                profile.fee_status = "pending"
                profile.save()