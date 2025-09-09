import {CUSTOM_FORM_BUILDER_FIELDS, mapPersonIdToLabel, TYPE_USER_ATTRS} from "@agir/lib/formBuilderWidget/fields";

export function mapFormBuildFieldToCrispy(field) {
    const crispyField = {
        type: mapFormBuilderTypeToCrispy(field),
    }
    mapFormBuilderParametersToCrispy(field, crispyField)

    if (field.values) {
        crispyField.choices = field.values.map((value) => {
            if (field.type === "radio-group") {
                return value.label
            }
            return [value.value, value.label]
        })
    }
    TYPE_USER_ATTRS[crispyField.type]?.toCrispy?.(field, crispyField);

    return crispyField
}

export function mapCrispyFieldToFormBuilderField(field) {
    const fbField = {
        type: mapCrispyTypeToFormBuilder(field),
    };
    mapCrispyFieldParametersToFormBuilder(field, fbField)
    TYPE_USER_ATTRS[fbField.type]?.toFormBuilder?.(field, fbField);

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
    "max_value": "max",
    "types": "types",
    "allowed_extensions": "allowed_extensions",
    "group_type": "group_type"
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
    'boolean': 'boolean',
    'phone_number': 'phoneNumber',
    'group': 'group',
    'person': 'person',
    "commune": "commune",
    "region": "region",
    "departements_circonscriptions_afe": "departements_circonscriptions_afe",
};

const MAPPING_TYPE_TO_CRISPY = Object.keys(MAPPING_TYPE_TO_FORM_BUILDER).reduce((acc, current) => {
    return {
        ...acc,
        [MAPPING_TYPE_TO_FORM_BUILDER[current]]: current
    }
}, {})

export function mapCrispyTypeToFormBuilder(field) {
    if (field.person_field) {
        return "person"
    } else if (field.id === "departement") {
        return "departements_circonscriptions_afe"
    }
    return MAPPING_TYPE_TO_FORM_BUILDER[field.type] || 'text';
}


export function mapFormBuilderTypeToCrispy({type: fbType}) {
    return MAPPING_TYPE_TO_CRISPY[fbType] || 'short_text';
}