import CIRCONSCRIPTIONS from './circonscription.json'

export const CUSTOM_FORM_BUILDER_FIELDS = [
    {
        label: "Titre",
        type: "text",
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
        label: "Circonscription",
        type: "select",
        name: "circonscriptions",
        multiple: false,
        values: CIRCONSCRIPTIONS,
        icon: "🗾"
    }
]
