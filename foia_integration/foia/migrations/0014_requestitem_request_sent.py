# Generated by Django 3.1.1 on 2020-09-19 05:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('foia', '0013_auto_20200919_0529'),
    ]

    operations = [
        migrations.AddField(
            model_name='requestitem',
            name='request_sent',
            field=models.BooleanField(default=False),
        ),
    ]