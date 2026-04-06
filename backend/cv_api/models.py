from django.db import models
from django.contrib.auth.models import User

class CV(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Personal Info - Matching your 'personalInfo' state
    name = models.CharField(max_length=255) # changed from full_name to match React
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(max_length=254)
    address = models.TextField(blank=True)
    visa_status = models.CharField(max_length=255, blank=True) # matches visaStatus

    # Style Settings - Matching your 'cvSettings' state
    font = models.CharField(max_length=100, default='Arial')
    font_size = models.CharField(max_length=50, default='11px')
    margins = models.CharField(max_length=50, default='narrow')
    accent_color = models.CharField(max_length=7, default='#000000')

    def __str__(self):
        return f"CV of {self.name}"

class HeaderLink(models.Model):
    cv = models.ForeignKey(CV, related_name='links', on_delete=models.CASCADE)
    label = models.CharField(max_length=100)
    url = models.URLField()

class Section(models.Model):
    SECTION_TYPES = (
        ('generic', 'Generic'),
        ('experience', 'Experience'),
        ('education', 'Education'),
    )
    cv = models.ForeignKey(CV, related_name='sections', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=SECTION_TYPES)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

class Entry(models.Model):
    section = models.ForeignKey(Section, related_name='entries', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    # Experience Fields
    job_title = models.CharField(max_length=255, blank=True) # jobTitle
    company = models.CharField(max_length=255, blank=True)
    company_url = models.URLField(blank=True) # companyURL
    
    # Education Fields
    degree = models.CharField(max_length=255, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    
    # Generic Fields
    subheading = models.CharField(max_length=255, blank=True)
    link_label = models.CharField(max_length=100, blank=True) # linkLabel
    
    # Shared Fields
    location = models.CharField(max_length=255, blank=True)
    start_date = models.CharField(max_length=100, blank=True) # startDate
    end_date = models.CharField(max_length=100, blank=True) # endDate
    text = models.TextField(blank=True)
    link_url = models.URLField(blank=True) # link (Used in Education & Generic)

    class Meta:
        ordering = ['order']

class Bullet(models.Model):
    entry = models.ForeignKey(Entry, related_name='bullets', on_delete=models.CASCADE)
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']