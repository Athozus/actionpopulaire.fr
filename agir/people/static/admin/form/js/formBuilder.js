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
        attrs: {
            type: "phoneNumber"
        },
        icon: "📞"
    },
    {
        label: "Email",
        attrs: {
            type: "email"
        },
        icon: "@"
    }
]

const DEFAULT_TEMPLATE = (fieldData) => ({
    field: '<span id="' + fieldData.name + '"',
    onRender: () => fieldData.name
})

const CUSTOM_FORM_BUILDER_TEMPLATES = {
    title: DEFAULT_TEMPLATE,
    phoneNumber: DEFAULT_TEMPLATE,
    email: DEFAULT_TEMPLATE
}

function titleToField(title) {
    return {
        "type": "title",
        "subtype": "h2",
        "label": title,
        "access": false
    }
}
function crispyFormToFormBuilder(crispyForm) {
    return crispyForm.reduce((acc, current) => {

        const section = []
        if (current.title) {
            section.push(titleToField(current.title))
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
    console.log(existingConfig)

    // Convertir la config Crispy existante en format FormBuilder si nécessaire
    if (Array.isArray(existingConfig) && existingConfig.length) {
        formBuilderData = crispyFormToFormBuilder(existingConfig)
    }
    console.log('formBuilder data', formBuilderData)

    const fb = $('#fb-editor').formBuilder({
        formData: formBuilderData,
        fields: CUSTOM_FORM_BUILDER_FIELDS,
        templates: CUSTOM_FORM_BUILDER_TEMPLATES
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

function convertFormBuilderToCrispy(formBuilderData) {
    const crispyConfig = {
        fields: [],
            form_class: 'DynamicForm'
    };

    formBuilderData.forEach(function(field) {
        const crispyField = {
            name: field.name || 'field_' + Math.random().toString(36).substr(2, 9),
                label: field.label || '',
                type: mapFormBuilderTypeToCrispy(field.type),
                required: field.required || false,
                help_text: field.description || ''
        };

        // Gestion des options pour les champs de choix
        if (field.values && field.values.length > 0) {
            crispyField.choices = field.values.map(function(option) {
                return [option.value || option.label, option.label];
            });
        }

        // Propriétés du widget
        if (field.placeholder || field.maxlength) {
            crispyField.widget_attrs = {};
            if (field.placeholder) crispyField.widget_attrs.placeholder = field.placeholder;
            if (field.maxlength) crispyField.widget_attrs.maxlength = field.maxlength;
        }

        crispyConfig.fields.push(crispyField);
    });

    return crispyConfig;
}

function mapFormBuilderTypeToCrispy(fbType) {
    const mapping = {
        'text': 'CharField',
            'textarea': 'TextField',
            'email': 'EmailField',
            'number': 'IntegerField',
            'select': 'ChoiceField',
            'radio-group': 'ChoiceField',
            'checkbox-group': 'MultipleChoiceField',
            'date': 'DateField',
            'file': 'FileField',
            'checkbox': 'BooleanField'
    };
    return mapping[fbType] || 'CharField';
}

function mapCrispyFieldToFormBuilderField(field) {
    const fbField = {
        type: mapCrispyTypeToFormBuilder(field.type),
        label: field.label,
        required: field.required || false,
        description: field.help_text || ''
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

function mapCrispyTypeToFormBuilder(crispyType) {
    const mapping = {
        'short_text': 'text',
        'TextField': 'textarea',
        'email_address': 'text',
        'IntegerField': 'number',
        'choice': 'select',
        'radio_choice': 'checkbox-group',
        'multiple_choice': 'checkbox-group',
        'date': 'date',
        'FileField': 'file',
        'BooleanField': 'checkbox',
        'phone_number': 'text'
    };
    return mapping[crispyType] || 'text';
}