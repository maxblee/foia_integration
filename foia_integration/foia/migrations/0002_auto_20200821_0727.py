# Generated by Django 3.1 on 2020-08-21 07:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('foia', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pratemplate',
            name='template',
            field=models.JSONField(verbose_name='JSON version of public records template'),
        ),
    ]
