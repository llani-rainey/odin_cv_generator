from django.db import models
from django.contrib.auth.models import User


class CV(models.Model): #start at biggest/parent (User is built in to django and imported here)
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Personal Info
    name = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(max_length=254, blank=True)
    address = models.TextField(blank=True)
    visa_status = models.CharField(max_length=255, blank=True)

    # CV Settings
    font = models.CharField(max_length=100, default='Arial')
    font_size = models.CharField(max_length=50, default='11px')
    margins = models.CharField(max_length=50, default='narrow')
    accent_color = models.CharField(max_length=7, default='#000000')

    def __str__(self):
        return f"CV of {self.name}"


class HeaderLink(models.Model):
    cv = models.ForeignKey(CV, related_name='links', on_delete=models.CASCADE)
    label = models.CharField(max_length=100, blank=True)
    url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ['order']  # add this

    def __str__(self):
        return f"{self.label} ({self.url})"


class Section(models.Model):
    SECTION_TYPES = ( # tuple of tuples
        ('generic', 'Generic'), # db_value i.e what gets stored in the db column, display value i.e what shows in Django admin UI
        ('experience', 'Experience'),
        ('education', 'Education'),
    )
    cv = models.ForeignKey(CV, related_name='sections', on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=20, choices=SECTION_TYPES)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} ({self.type})"


class Entry(models.Model):
    section = models.ForeignKey(Section, related_name='entries', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    # Experience fields
    job_title = models.CharField(max_length=255, blank=True) #jobTitle
    company = models.CharField(max_length=255, blank=True)
    company_url = models.URLField(blank=True) #companyURL

    # Education fields
    degree = models.CharField(max_length=255, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    institution_url = models.URLField(blank=True) #institutionURL

    # Generic fields
    subheading = models.CharField(max_length=255, blank=True)
    link_label = models.CharField(max_length=100, blank=True) #linkLabel
    link_url = models.URLField(blank=True) #linkURL

    # Shared fields
    location = models.CharField(max_length=255, blank=True)
    start_date = models.CharField(max_length=100, blank=True) #startDate
    end_date = models.CharField(max_length=100, blank=True) #endDate
    text = models.TextField(blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.job_title or self.degree or self.subheading or f"Entry {self.id}"


class Bullet(models.Model):
    entry = models.ForeignKey(Entry, related_name='bullets', on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text[:50]
    

# class-level version where you start from scratch and fetch from the DB:
#CV.objects.get(id=1).sections.first().entries.first().bullets.all()
#          ^
#          fetches the CV from DB first, then traverses down

# isntance version where you already have the CV, going DOWN (parent → children) using related_name — instance is a CV
# instance.sections.first().entries.first().bullets.all()  # CV → Section → Entry → Bullet

# going UP (child → parent) using FK field name — start from a bullet
# bullet.entry.section.cv.user  # Bullet → Entry → Section → CV → User