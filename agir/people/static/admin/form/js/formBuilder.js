const CUSTOM_FORM_BUILDER_FIELDS = [
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
    }

]

const DEFAULT_TEMPLATE = (fieldData) => ({
    field: '<span id="' + fieldData.name + '">',
    onRender: () => fieldData.name
})

const CUSTOM_FORM_BUILDER_TEMPLATES = {
    title: DEFAULT_TEMPLATE,
    phoneNumber: DEFAULT_TEMPLATE,
    email: DEFAULT_TEMPLATE,
    introHtml: DEFAULT_TEMPLATE
}

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
    container.style.width = "80%";

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

    //// Sauvegarder automatiquement les changements
    //const textarea = document.getElementsByName('{name}')[0];

    //function saveFormBuilderData() {
    //    const formData = fbEditor.formData;
    //    const crispyConfig = convertFormBuilderToCrispy(formData);
    //    textarea.value = JSON.stringify(crispyConfig);
    //}

    //// Écouter les changements
    //fbEditor.promise.then(function() {
    //    saveFormBuilderData();

    //    // Sauvegarder à chaque modification
    //    document.getElementById('formbuilder-{name}').addEventListener('change', saveFormBuilderData);
    //    document.getElementById('formbuilder-{name}').addEventListener('input', saveFormBuilderData);
    //});
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

    if (field.values) {
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
    if (field.widget_attrs) {
        if (field.widget_attrs.placeholder) fbField.placeholder = field.widget_attrs.placeholder;
        if (field.widget_attrs.maxlength) fbField.maxlength = field.widget_attrs.maxlength;
    }

    return fbField;
}

const MAPPING_TYPE_TO_FORM_BUILDER= {
    'short_text': 'text',
    'TextField': 'textarea',
    'email_address': 'email',
    'integer': 'number',
    'choice': 'select',
    'radio_choice': 'radio-group',
    'multiple_choice': 'checkbox-group',
    'date': 'date',
    'file': 'file',
    'boolean': 'checkbox',
    'phone_number': 'phoneNumber'
};

function mapCrispyTypeToFormBuilder(crispyType) {
    return MAPPING_TYPE_TO_FORM_BUILDER[crispyType] || 'text';
}


function mapFormBuilderTypeToCrispy(fbType) {
    const reversedType = Object.keys(MAPPING_TYPE_TO_FORM_BUILDER).reduce((acc, current) => {
        return {
            ...acc,
            [MAPPING_TYPE_TO_FORM_BUILDER[current]]: current
        }
    }, {})
    return reversedType[fbType] || 'short_text';
}