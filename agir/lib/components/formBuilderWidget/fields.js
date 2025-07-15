import CIRCONSCRIPTIONS from './circonscription.json'
import CIRCONSCRIPTIONS_CONSULAIRES from './circonscriptionConsulaire.json'
import CANTONS from './cantons.json'

export const CUSTOM_FORM_BUILDER_FIELDS = [
    {
        label: "Titre",
        type: "",
        attrs: {
            type: "title"
        },
        icon: "📄"
    },
    {
        label: "Champ Personne",
        type: "person",
        required: true,
        icon: "👤"
    },
    {
        label: "Introduction",
        type: "introHtml",
        icon: "🔤"
    },
    {
        label: "GA - En tant que membre",
        subtype: "group_member",
        type: "group",
        icon: "👥"
    },
    {
        label: "GA - En tant qu'animatrices",
        type: "group",
        subtype: "group_animatrice",
        choices: "animatrice",
        group_type: "L",
        icon: "👥"
    },
    {
        label: "GA- En tant que gestionnaires",
        type: "group",
        subtype: "group_gestionnaire",
        group_type: "L",
        choices: "gestionnaire",
        icon: "👥"
    },
    {
        label: "Mes boucles départementales",
        type: "group",
        subtype: "group_departemental",
        choices: "member",
        group_type: "D",
        icon: "🗺️"
    },
    {
        label: "Mes groupes fonctionnels",
        type: "group",
        subtype: "group_fonctionnel",
        group_type: "F",
        choices: "member",
        icon: "📃"
    },
    {
        label: "Mes Groupes thématiques",
        type: "group",
        group_type: "B",
        choices: "member",
        subtype: "group_thematique",
        icon: "🚩"
    },
    {
        label: "Departements Assemblée des Français de l’Étranger",
        type: "departements_circonscriptions_afe",
    },
    {
        label: "Circonscriptions",
        type: "select",
        name: "circonscriptions",
        multiple: false,
        values: CIRCONSCRIPTIONS,
        icon: "🗾"
    },
    {
        label: "Circonscriptions consulaires",
        type: "select",
        name: "circonscriptions_consulaires",
        multiple: false,
        values: CIRCONSCRIPTIONS_CONSULAIRES,
        icon: "🌐"
    },
    {
      label: "Cantons",
      type: "select",
      subtype: "cantons",
      name: "cantons",
      multiple: false,
      values: CANTONS,
      icon: "🏢"
    },
    {
        label: "Commune",
        type: "commune",
        icon: "🏙️"
    },
    {
        label: "Case à cocher",
        type: "boolean",
        icon: "☑️"
    }
]

export const TYPE_USER_ATTRS = {
    departements_circonscriptions_afe: {
        toCrispy: (fbField, crispyField) => {
            crispyField.choices = "departements_circonscriptions_afe"
            crispyField.type = "choice"
            crispyField.id = "departement"
        },
    },
    person: {
        field: {
            label: 'Champ prérempli',
            options: {
                'first_name': 'Prénom',
                'last_name': 'Nom',
                'email': 'Email',
                'contact_phone': 'Numéro de téléphone',
                'gender': 'Genre',
                'date_of_birth': "Date de naissance",
                'location_city': "Ville",
                'location_zip': "Code postal",
            },
            style: 'border: 1px solid red'
        },
        toCrispy: (fbField, crispyField) => {
            crispyField.id = fbField.field;
            crispyField.person_field = true
            if (crispyField.type) {
                delete crispyField.type
            }
        },
        toFormBuilder: (crispyField, fbField) => {
            fbField.field = crispyField.id
            if (crispyField.label === undefined) {
                fbField.label = mapPersonIdToLabel(crispyField.id)
                fbField.required = true
            }
        }
    },
    commune: {
        types: {
            label: "Type",
            multiple: true,
            options: {
                "COM": "commune",
                "ARM": "arrondissement municipal",
                "COMA": "commune associée",
                "COMD": "commune déléguée",
                "SRM": "secteur électoral"
            }
        },
    },
    file: {
        allowed_extensions: {
            label: "Extension(s) possible(s)",
            multiple: true,
            options: {
                "jpg": "Image jpg",
                "jpeg": "Image jpeg",
                "png": "Image png",
                "pdf": "Fichier PDF",
                "docx": "Fichier Docx",
                "doc": "Fichier Doc",
                "odt": "Fichier ODT"
            }
        }
    },
    group: {
        group_type: {
            label: "Type de groupe",
            options: {
                "L": "Groupe local",
                "F": "Groupe fonctionnel",
                "B": "Groupe thématique",
                "D": "Boucle départementale"
            }
        },
        choices: {
            label: "La personne dans le groupe est (à minima)",
            options: {
                "membre": "Membre",
                "animatrice": "Animatrice",
                "gestionnaire": "Gestionnaire"
            }
        }
    }
}

export function mapPersonIdToLabel(id) {
    return TYPE_USER_ATTRS.person.field.options[id]
}