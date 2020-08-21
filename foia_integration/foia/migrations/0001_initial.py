# Generated by Django 3.1 on 2020-08-21 07:26

from django.conf import settings
import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='State',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('abbr', models.CharField(help_text='The 2-letter state (or federal) abbreviation', max_length=2, unique=True, verbose_name='abbreviation')),
                ('public_records_act_name', models.CharField(max_length=200, verbose_name='name of state public records act')),
                ('maximum_response_time', models.PositiveSmallIntegerField(blank=True, help_text='What is the maximum time allowed for an initial response?', null=True)),
                ('maximum_extension_time', models.PositiveSmallIntegerField(blank=True, help_text='What is the maximum amount of time allowed for an extension?', null=True)),
                ('business_days', models.BooleanField(blank=True, help_text='Is the maximum response time in business days or calendar days?', null=True, verbose_name='Response time is in Business Days')),
                ('business_days_extension', models.BooleanField(blank=True, help_text='Is the maximum time allowed for an extension in business days or calendar days?', null=True, verbose_name='Extension time is in Business Days')),
            ],
            options={
                'ordering': ['abbr'],
            },
        ),
        migrations.CreateModel(
            name='PRATemplate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('template', django.contrib.postgres.fields.jsonb.JSONField(verbose_name='JSON version of public records template')),
                ('upload_date', models.DateTimeField(auto_now=True)),
                ('state', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='foia.state')),
                ('template_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
