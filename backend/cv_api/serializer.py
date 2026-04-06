from rest_framework import serializers
from .models import CV, HeaderLink, Section, Entry, Bullet


class BulletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bullet
        fields = ["id", "text", "order"]


class EntrySerializer(serializers.ModelSerializer):
    bullets = BulletSerializer(many=True)

    jobTitle = serializers.CharField(source="job_title", allow_blank=True)
    companyURL = serializers.URLField(
        source="company_url", allow_blank=True, required=False
    )
    linkLabel = serializers.CharField(source="link_label", allow_blank=True)
    startDate = serializers.CharField(source="start_date", allow_blank=True)
    endDate = serializers.CharField(source="end_date", allow_blank=True)
    institutionURL = serializers.URLField(
        source="institution_url", allow_blank=True, required=False
    )
    linkUrl = serializers.URLField(source="link_url", allow_blank=True, required=False)

    class Meta:
        model = Entry
        fields = [
            "id",
            "order",
            "jobTitle",
            "company",
            "companyURL",
            "degree",
            "institution",
            "institutionURL",
            "subheading",
            "linkLabel",
            "linkUrl",
            "location",
            "startDate",
            "endDate",
            "text",
            "bullets",
        ]


class SectionSerializer(serializers.ModelSerializer):
    entries = EntrySerializer(many=True)

    class Meta:
        model = Section
        fields = ["id", "title", "type", "order", "entries"]


class HeaderLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderLink
        fields = ["id", "label", "url", "order"]


class CVSerializer(serializers.ModelSerializer):
    links = HeaderLinkSerializer(many=True)
    sections = SectionSerializer(many=True)

    visaStatus = serializers.CharField(source="visa_status", allow_blank=True)
    fontSize = serializers.CharField(source="font_size")
    accentColor = serializers.CharField(source="accent_color")

    class Meta:
        model = CV
        fields = [
            "id",
            "name",
            "title",
            "location",
            "phone",
            "email",
            "address",
            "visaStatus",
            "font",
            "fontSize",
            "margins",
            "accentColor",
            "links",
            "sections",
        ]

    def create(self, validated_data):
        links_data = validated_data.pop("links", [])
        sections_data = validated_data.pop("sections", [])

        cv = CV.objects.create(**validated_data)

        for order, link_data in enumerate(links_data):
            HeaderLink.objects.create(cv=cv, order=order, **link_data)

        for s_order, section_data in enumerate(sections_data):
            entries_data = section_data.pop("entries", [])
            section = Section.objects.create(cv=cv, order=s_order, **section_data)

            for e_order, entry_data in enumerate(entries_data):
                bullets_data = entry_data.pop("bullets", [])
                entry = Entry.objects.create(
                    section=section, order=e_order, **entry_data
                )

                for b_order, bullet_data in enumerate(bullets_data):
                    Bullet.objects.create(entry=entry, order=b_order, **bullet_data)

        return cv

    def update(self, instance, validated_data):
        links_data = validated_data.pop("links", [])
        sections_data = validated_data.pop("sections", [])

        # update CV fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # delete and recreate links
        instance.links.all().delete()
        for order, link_data in enumerate(links_data):
            HeaderLink.objects.create(cv=instance, order=order, **link_data)

        # delete and recreate sections, entries, bullets
        instance.sections.all().delete()
        for s_order, section_data in enumerate(sections_data):
            entries_data = section_data.pop("entries", [])
            section = Section.objects.create(cv=instance, order=s_order, **section_data)

            for e_order, entry_data in enumerate(entries_data):
                bullets_data = entry_data.pop("bullets", [])
                entry = Entry.objects.create(
                    section=section, order=e_order, **entry_data
                )

                for b_order, bullet_data in enumerate(bullets_data):
                    Bullet.objects.create(entry=entry, order=b_order, **bullet_data)

        return instance
