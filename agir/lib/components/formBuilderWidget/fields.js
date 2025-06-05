import CIRCONSCRIPTIONS from './circonscription.json'
import CIRCONSCRIPTIONS_CONSULAIRES from './circonscriptionConsulaire.json'

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
        label: "Numéro de Téléphone",
        type: "text",
        subtype: "tel",
        icon: "📞"
    },
    {
        label: "Email",
        type: "text",
        subtype: "email",
        icon: "@"
    },
    {
        label: "Introduction",
        type: "text",
        attrs: {
            type: "introHtml"
        },
    },
    {
        label: "Mes groupes - En tant que membre",
        type: "group_local_member",
        attrs: {
            groupScope: "member",
            groupType: "L"
        },
        icon: "👥"
    },
    {
        label: "Mes groupes - En tant qu'animatrices",
        type: "group_local_animatrice",
        attrs: {
            groupScope: "animatrice",
            groupType: "L"
        },
        icon: "👥"
    },
    {
        label: "Mes groupes - En tant que gestionnaires",
        type: "group_local_gestionnaire",
        attrs: {
            groupType: "L",
            groupScope: "gestionnaire",
        },
        icon: "👥"
    },
    {
        label: "Mes boucles départementales",
        type: "group_member_departemental",
        attrs: {
            groupScope: "member",
            groupType: "D"
        },
        icon: "🗺️"
    },
    {
        label: "Mes groupes fonctionnels",
        type: "group_member_fonctionnel",
        attrs: {
            groupType: "F",
            groupScope: "member"
        },
        icon: "📃"
    },
    {
        label: "Mes Groupes thématiques",
        type: "group_member_thematique",
        attrs: {
            groupType: "B",
            groupScope: "member"
        },
        icon: "🚩"
    },
    {
        label: "Groupe d'action",
        type: "group",
        attrs: {
            groupScope: "member"
        },
        icon: ""
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
        label: "Champ Personne",
        type: "person",
        required: true,
        icon: "👤"
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
                'location_zip': "Code postal"
            },
            style: 'border: 1px solid red'
        },
        toCrispy: (fbField, crispyField) => {
            crispyField.id = fbField.field;
            crispyField.person_field = true
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
    }
}

export function mapPersonIdToLabel(id) {
    return TYPE_USER_ATTRS.person.field.options[id]
}