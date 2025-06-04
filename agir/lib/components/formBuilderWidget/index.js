import {CUSTOM_FORM_BUILDER_FIELDS, mapPersonIdToLabel, TYPE_USER_ATTRS} from "./fields";
import {CUSTOM_FORM_BUILDER_TEMPLATES} from "./templates";

import "./groupControl"
import {i18n} from "@agir/lib/formBuilderWidget/formBuilderI18N";

const DEFAULT_ROWS_TO_HIDE = ["step", "other", "inline", "className", "name", "access", "placeholder", "value", "subtype"]

function titleToField(title) {
    return {
        "type": "title",
        "subtype": "h2",
        "label": title,
        "access": false
    }
}

function introToField(intro) {
    return {
        "type": "introHtml",
        "subtype": "p",
        "label": intro,
        "access": false
    }
}

function crispyFormToFormBuilder(crispyForm) {
    return crispyForm.reduce((acc, current) => {

        const section = []
        if (current.title) {
            section.push(titleToField(current.title))
        }
        if (current.intro_html) {
            section.push(introToField(current.intro_html))
        }
        current.fields?.forEach((field) => {
            section.push(mapCrispyFieldToFormBuilderField(field))
        })

        return [...acc, ...section]
    }, [])

}

function updateContainerStyle() {
    const container = document.getElementById("formbuilder-container")
    container.style.width = "90%";

    const fbEditor = document.getElementById("fb-editor")
    fbEditor.style.border = "3px dotted #eeeeee"
}

document.addEventListener('DOMContentLoaded', function () {
    const existingConfig = JSON.parse(document.getElementById("custom_fields").innerText)
    let formBuilderData = [];

    // Convertir la config Crispy existante en format FormBuilder
    if (Array.isArray(existingConfig) && existingConfig.length) {
        formBuilderData = crispyFormToFormBuilder(existingConfig)
    }

    const fb = $('#fb-editor').formBuilder({
        i18n: i18n,
        formData: formBuilderData,
        fields: CUSTOM_FORM_BUILDER_FIELDS,
        templates: CUSTOM_FORM_BUILDER_TEMPLATES,
        typeUserAttrs: TYPE_USER_ATTRS,
        disableFields: ["header", "button", "hidden", "paragraph"],
        onOpenFieldEdit: function(editPanel) {
            const fieldType = editPanel.offsetParent.type
            //on cache les champs qui ne seront pas mappé vers le système Form Crispy
            let rowsToDelete = DEFAULT_ROWS_TO_HIDE
            if (fieldType === 'person') {
                rowsToDelete = ["placeholder", "description", "className", "name", "access", "value"]
            }
            rowsToDelete.forEach((row) => {
                const wrap = editPanel.querySelector(`.form-group.${row}-wrap`)
                if (wrap) {
                    wrap.style.display = "none";
                }
            })

        },
        onSave: save
    })
    updateContainerStyle()
    window.AgirAdminJsonWidgetEditor?.collapseAll()
});

function save(event, formData) {
    const finalFormData = []
    const jsonForm = JSON.parse(formData)
    for (let element of jsonForm) {
        const lastSection = finalFormData[finalFormData.length - 1]
        if (element.type === "title") {
            finalFormData.push({
                "title": element.label,
                "fields": []
            })
        } else if (element.type === "introHtml") {
            lastSection["intro_html"] = element.label
        } else {
            lastSection.fields?.push(mapFormBuildFieldToCrispy(element))
        }
    }

    if (window.AgirAdminJsonWidgetEditor) {
        window.AgirAdminJsonWidgetEditor.update(finalFormData)
        document.getElementById(`id_custom_fields`).value = JSON.stringify(finalFormData);

        document.getElementsByName("_continue")?.[0]?.click()
    }
}

function mapFormBuildFieldToCrispy(field) {
    const crispyField = {
        type: mapFormBuilderTypeToCrispy(field),
    }
    mapFormBuilderParametersToCrispy(field, crispyField)

    if (field.type.includes("group_")) {
        const builderField = CUSTOM_FORM_BUILDER_FIELDS.find((f) => f.type === field.type);
        crispyField.choices = builderField.attrs.groupScope ?? "member"
        crispyField.group_type = builderField.attrs.groupType ?? "L"
    } else if (field.values) {
        crispyField.choices = field.values.map((value) => {
            if (field.type === "radio-group") {
                return value.label
            }
            return [value.value, value.label]
        })
    } else if (field.type === "person") {
        crispyField.id = field.field;
        crispyField.person_field = true
    } else if (field.type === "commune") {
        crispyField.types = field.field
    }

    return crispyField
}

function mapCrispyFieldToFormBuilderField(field) {
    const fbField = {
        type: mapCrispyTypeToFormBuilder(field),
    };
    mapCrispyFieldParametersToFormBuilder(field, fbField)

    if (field.type === "group") {
        const fbDefaultField = CUSTOM_FORM_BUILDER_FIELDS.find((f) =>
            f.attrs?.groupType === field.group_type && f.attrs?.groupScope === field.choices && f.type.startsWith("group")) ?? CUSTOM_FORM_BUILDER_FIELDS.find((f) => f.type === "group")

        if (fbDefaultField) {
            fbField.attrs = fbDefaultField.attrs
            fbField.type = fbDefaultField.type
        }
    } else if (fbField.type === "person") {
        fbField.field = field.id
        if (field.label === undefined) {
            fbField.label = mapPersonIdToLabel(field.id)
            fbField.required = true
        }
    } else if (fbField.type === "commune") {
        fbField.field = field.types
    }

    if (field.choices && Array.isArray(field.choices)) {
        fbField.values = field.choices.map(choice => {
            return Array.isArray(choice) ?
                {
                    label: choice[1],
                    value: choice[0]
                } : {
                    label: choice,
                    value: choice
                };
        });
    }

    return fbField;
}

const MAPPING_COMMON_PARAMS_TO_FORM_BUILDER = {
    "label": "label",
    "required": "required",
    "help_text": "description",
    "max_length": "maxlength",
    "id": "name",
    "min_value": "min",
    "max_value": "max"
}

const MAPPING_COMMON_PARAMS_TO_CRISPY = Object.keys(MAPPING_COMMON_PARAMS_TO_FORM_BUILDER).reduce((acc, current) => {
    return {
        ...acc,
        [MAPPING_COMMON_PARAMS_TO_FORM_BUILDER[current]]: current
    }
}, {})

function mapCrispyFieldParametersToFormBuilder(crispyField, formField) {
    return mapParameterToField(crispyField, formField, MAPPING_COMMON_PARAMS_TO_FORM_BUILDER)
}

function mapFormBuilderParametersToCrispy(formField, crispyField) {
    return mapParameterToField(formField, crispyField, MAPPING_COMMON_PARAMS_TO_CRISPY)
}

function mapParameterToField(origin, field, parameters) {
    for (let parameter in parameters) {
        if (origin[parameter] !== undefined) {
            field[parameters[parameter]] = origin[parameter]
        }
    }
    return field
}

const MAPPING_TYPE_TO_FORM_BUILDER = {
    'short_text': 'text',
    'long_text': 'textarea',
    'email_address': 'email',
    'integer': 'number',
    'choice': 'select',
    'radio_choice': 'radio-group',
    'multiple_choice': 'checkbox-group',
    "autocomplete_choice": "autocomplete",
    'date': 'date',
    'file': 'file',
    'boolean': 'checkbox',
    'phone_number': 'phoneNumber',
    'group': 'group',
    'person': 'person',
    "commune": "commune",
};

const MAPPING_TYPE_TO_CRISPY = Object.keys(MAPPING_TYPE_TO_FORM_BUILDER).reduce((acc, current) => {
    return {
        ...acc,
        [MAPPING_TYPE_TO_FORM_BUILDER[current]]: current
    }
}, {})

function mapCrispyTypeToFormBuilder(field) {
    if (field.person_field) {
        return "person"
    }
    return MAPPING_TYPE_TO_FORM_BUILDER[field.type] || 'text';
}


function mapFormBuilderTypeToCrispy({type: fbType}) {
    if (fbType.includes("group_")) {
        return "group"
    }

    return MAPPING_TYPE_TO_CRISPY[fbType] || 'short_text';
}