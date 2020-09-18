# Generated by Django 3.1.1 on 2020-09-17 06:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("foia", "0008_requestcontent"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="requestcontent",
            options={
                "ordering": ("-date_filed",),
                "verbose_name": "FOIA Request Body",
                "verbose_name_plural": "FOIA Request Bodies",
            },
        ),
        migrations.AddField(
            model_name="requestcontent",
            name="date_filed",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
