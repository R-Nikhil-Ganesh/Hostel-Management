from django.apps import AppConfig

class HostelAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hostel_app'

    def ready(self):
        from . import signals  # ensures signals.py is imported
