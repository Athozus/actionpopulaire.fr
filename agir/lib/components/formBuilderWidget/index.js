import {CUSTOM_FORM_BUILDER_FIELDS} from "./fields";
import {CUSTOM_FORM_BUILDER_TEMPLATES} from "./templates";

import "./groupControl"

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

document.addEventListener('DOMContentLoaded', function() {
    const existingConfig= JSON.parse(document.getElementById("custom_fields").innerText)
    let formBuilderData = [];

    // Convertir la config Crispy existante en format FormBuilder si nécessaire
    if (Array.isArray(existingConfig) && existingConfig.length) {
        formBuilderData = crispyFormToFormBuilder(existingConfig)
    }

    const fb = $('#fb-editor').formBuilder({
        formData: formBuilderData,
        fields: CUSTOM_FORM_BUILDER_FIELDS,
        templates: CUSTOM_FORM_BUILDER_TEMPLATES,
        onSave: save
    })
    updateContainerStyle()
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
        type: mapFormBuilderTypeToCrispy(field.type),
        label: field.label,
        help_text: field.description,
        required: field.required,
        id: field.name
    }

    if (field.type === "group") {
        // also check if there is a group type
        const builderField = CUSTOM_FORM_BUILDER_FIELDS.find((f) => f.label === field.label);
        crispyField.choices = builderField.attrs.groupScope ?? "member"
        crispyField.group_type = builderField.attrs.groupType ?? "L"
    } else if (field.values) {
        crispyField.choices = field.values.map((value) => {
            if (field.type === "radio-group" || field.type === "select") {
                return value.label
            }
            return [value.value, value.label]
        })
    }

    return crispyField
}

function mapCrispyFieldToFormBuilderField(field) {
    const fbField = {
        type: mapCrispyTypeToFormBuilder(field.type),
        label: field.label,
        required: field.required || false,
        description: field.help_text || '',
        name: field.id
    };

    if (field.choices) {
        if (typeof field.choices === "string" && field.type === "group") {
            //TODO add group type from fields list
            //field.group_type =
        } else {
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
    }

    if (field.widget_attrs) {
        if (field.widget_attrs.placeholder) fbField.placeholder = field.widget_attrs.placeholder;
        if (field.widget_attrs.maxlength) fbField.maxlength = field.widget_attrs.maxlength;
    }

    return fbField;
}

const MAPPING_TYPE_TO_FORM_BUILDER= {
    'short_text': 'text',
    'long_text': 'textarea',
    'email_address': 'email',
    'integer': 'number',
    'choice': 'select',
    'radio_choice': 'radio-group',
    'multiple_choice': 'checkbox-group',
    'date': 'date',
    'file': 'file',
    'boolean': 'checkbox',
    'phone_number': 'phoneNumber',
    'group': 'group',
};

const MAPPING_TYPE_TO_CRISPY = Object.keys(MAPPING_TYPE_TO_FORM_BUILDER).reduce((acc, current) => {
    return {
        ...acc,
        [MAPPING_TYPE_TO_FORM_BUILDER[current]]: current
    }
}, {})

function mapCrispyTypeToFormBuilder(crispyType) {
    return MAPPING_TYPE_TO_FORM_BUILDER[crispyType] || 'text';
}


function mapFormBuilderTypeToCrispy(fbType) {
    if (fbType.includes("group_")) {
        return "group"
    }
    return MAPPING_TYPE_TO_CRISPY[fbType] || 'short_text';
}