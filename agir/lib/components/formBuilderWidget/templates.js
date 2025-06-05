import {mapPersonIdToLabel} from "@agir/lib/formBuilderWidget/fields";

const DEFAULT_TEMPLATE = (fieldData) => ({
    field: '<span id="' + fieldData.name + '">',
    onRender: () => fieldData.name
})

const USER_TEMPLATE = (fieldData) => ({
    field: '<span id="' + fieldData.name + '">',
    onRender: () => {
        const element = document.getElementById(fieldData.name)
        if (element) {
            element.innerText = `Champ prérempli : ${mapPersonIdToLabel(fieldData.field)}`
        }
    }
})

const BOOLEAN_TEMPLATE = (fieldData) => ({
    field: '<span id="' + fieldData.name + '">',
    onRender: () => {
        const element = document.getElementById(fieldData.name)
        if (element) {
            element.innerText = "(Case à cocher)"
        }
    }
})

export const CUSTOM_FORM_BUILDER_TEMPLATES = {
    title: DEFAULT_TEMPLATE,
    phoneNumber: DEFAULT_TEMPLATE,
    email: DEFAULT_TEMPLATE,
    introHtml: DEFAULT_TEMPLATE,
    group: DEFAULT_TEMPLATE,
    person: USER_TEMPLATE,
    commune: DEFAULT_TEMPLATE,
    boolean: BOOLEAN_TEMPLATE
}

