from agir.people.models import Person


def get_welcome_message_to_member(group_url):
    return f"""Bienvenue dans notre groupe d'action !

Tu peux consulter nos prochaines actions et/ou réunions dans l'agenda du groupe d'action.
N'hésite pas à nous rejoindre lors du prochain événement.

Si tu as des questions sur le fonctionnement du groupe d'action, n'hésite pas non plus à nous les poser en réponse à ce message. 

Au plaisir de te rencontrer bientôt 🙂"""


def get_welcome_message_subject(person: Person):
    return f"Bienvenue {person.display_name} !"
