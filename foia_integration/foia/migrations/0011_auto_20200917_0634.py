# Generated by Django 3.1.1 on 2020-09-17 06:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("foia", "0010_auto_20200917_0629"),
    ]

    operations = [
        migrations.AlterField(
            model_name="requestcontent", name="content", field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="requestcontent",
            name="subject_line",
            field=models.CharField(max_length=80),
        ),
    ]
