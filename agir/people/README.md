# People app

## commands

### extract_person

This Django management command extracts **all data related to a specific person** (`Person`) and outputs it as a **comprehensive JSON document**.
It takes an email address as an argument, retrieves the corresponding `Person` object, and gathers all associated data — including roles, memberships, event participation, payments, subscriptions, images, form submissions, and tags.
The output is printed directly to **standard output (stdout)** in JSON format, allowing you to easily redirect or inspect it in the terminal.
This command is particularly useful in cases where a **user requests a copy of their personal information** under data protection regulations (such as **GDPR / RGPD**), or when administrators need to **review or export** user-related data for auditing or debugging purposes.
