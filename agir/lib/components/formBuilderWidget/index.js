import {CUSTOM_FORM_BUILDER_FIELDS, mapPersonIdToLabel, TYPE_USER_ATTRS} from "./fields";
import {CUSTOM_FORM_BUILDER_TEMPLATES} from "./templates";

import {i18n} from "@agir/lib/formBuilderWidget/formBuilderI18N";
import {
    mapCrispyFieldToFormBuilderField,
    mapFormBuildFieldToCrispy
} from "@agir/lib/formBuilderWidget/mapperFormBuilder";

const DEFAULT_ROWS_TO_HIDE = ["step", "other", "inline", "className", "access", "placeholder", "value", "subtype"]

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

