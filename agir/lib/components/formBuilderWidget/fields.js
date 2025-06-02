export const CUSTOM_FORM_BUILDER_FIELDS = [
    {
        label: "Titre",
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
        attrs: {
            type: "introHtml"
        },
    },
    {
        label: "Mes groupes - En tant que membre",
        attrs: {
            type: "group",
            subType: "group_local_member",
            groupScope: "group_member",
            groupType: "L"
        },
        icon: "👥"
    },
    {
        label: "Mes groupes - En tant qu'animatrices",
        attrs: {
            type: "group",
            subType: "group_local_animatrice",
            groupScope: "animatrice",
            groupType: "L"
        },
        icon: "👥"
    },
    {
        label: "Mes groupes - En tant que gestionnaires",
        attrs: {
            type: "group",
            subType: "group_local_gestionnaire",
            groupType: "L",
            groupScope: "gestionnaire",
        },
        icon: "👥"
    },
    {
        label: "Mes boucles départementales",
        attrs: {
            type: "group",
            subType: "group_member_departemental",
            groupScope: "member",
            groupType: "D"
        },
        icon: "🗺️"
    },
    {
        label: "Mes groupes fonctionnels",
        attrs: {
            type: "group",
            subType: "group_member_fonctionnel",
            groupType: "F",
            groupScope: "member"
        },
        icon: "📃"
    },
    {
        label: "Mes Groupes thématiques",
        attrs: {
            type: "group",
            subType: "group_member_thematique",
            groupType: "B",
            groupScope: "member"
        },
        icon: "🚩"
    }
]
