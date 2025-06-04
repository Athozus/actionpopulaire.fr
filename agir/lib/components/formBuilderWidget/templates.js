const DEFAULT_TEMPLATE = (fieldData) => ({
    field: '<span id="' + fieldData.name + '">',
    onRender: () => fieldData.name
})

export const CUSTOM_FORM_BUILDER_TEMPLATES = {
    title: DEFAULT_TEMPLATE,
    phoneNumber: DEFAULT_TEMPLATE,
    email: DEFAULT_TEMPLATE,
    introHtml: DEFAULT_TEMPLATE,
    group: DEFAULT_TEMPLATE,
    group_local_member: DEFAULT_TEMPLATE,
    group_local_animatrice: DEFAULT_TEMPLATE,
    group_local_gestionnaire: DEFAULT_TEMPLATE,
    group_member_departemental: DEFAULT_TEMPLATE,
    group_member_fonctionnel: DEFAULT_TEMPLATE,
    group_member_thematique: DEFAULT_TEMPLATE
}

