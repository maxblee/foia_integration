# Generated by Django 3.1.1 on 2020-09-17 06:16

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("foia", "0007_source_is_records_officer"),
    ]

    operations = [
        migrations.CreateModel(
            name="RequestContent",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("subject_line", models.CharField(max_length=80)),
                ("content", models.TextField()),
                (
                    "expedited_processing",
                    models.TextField(
                        blank=True,
                        verbose_name="justification for expedited processing",
                    ),
                ),
                (
                    "fee_waiver",
                    models.TextField(
                        blank=True, verbose_name="fee waiver justification"
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]