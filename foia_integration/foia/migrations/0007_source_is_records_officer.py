# Generated by Django 3.1 on 2020-08-29 21:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("foia", "0006_source"),
    ]

    operations = [
        migrations.AddField(
            model_name="source",
            name="is_records_officer",
            field=models.BooleanField(
                default=False, verbose_name="Is this person a public records officer?"
            ),
        ),
    ]
