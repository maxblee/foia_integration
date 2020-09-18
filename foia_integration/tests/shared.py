def generate_fake_foia_recipient(fake_gen):
    """Generates a fake FOIA recipient (agency + name)"""
    municipality = fake_gen.city()
    return {
        "recipientFirstName": fake_gen.first_name(),
        "recipientLastName": fake_gen.last_name(),
        "agencyName": f"City of {municipality}",
        "foiaEmail": fake_gen.email(),
        "agencyStreetAddress": fake_gen.street_address(),
        "agencyZip": fake_gen.postcode(),
        "agencyMunicipality": municipality,
    }
