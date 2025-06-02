
/**
 * Remove null, undefined, empty string or empty array values from an object, original object is not modified
 * @param  {Object} obj {attrName: attrValue}
 * @param {boolean} [removeFalse=false] Remove values === false
 * @return {Object} Object trimmed of null or undefined values
 */
export const trimObj = function (obj, removeFalse = false) {
    if (null == obj || typeof obj !== 'object') return obj
    const attrs = (typeof window.structuredClone === 'function') ? window.structuredClone(obj) : Object.assign({}, obj)
    /** @type {(null|undefined|''|false)[]} xmlRemove */
    const xmlRemove = [null, undefined, '']
    if (removeFalse) {
        xmlRemove.push(false)
    }
    for (const attr in attrs) {
        if (xmlRemove.includes(attrs[attr])) {
            delete attrs[attr]
        } else if (Array.isArray(attrs[attr])) {
            if (!attrs[attr].length) {
                delete attrs[attr]
            }
        }
    }

    return attrs
}


if (!window.fbControls) window.fbControls = new Array();
window.fbControls.push(function (controlClass) {

    /**
     * Star rating class
     */
    class GroupControl extends controlClass {

        configure() {
            if (this.options === undefined) {
                this.options = {}
            }
            this.options.groupType = {
                label: 'Type de Groupe',
                type: 'select',
                options: {
                    as_member: 'En tant que membre',
                    as_animatrice: "En tant qu'animateurice",
                    as_gestionnaire: 'En tant que gestionnaire'
                },
                value: 'as_member'
            };
        }

        /**
         * Données visibles dans la palette de champs
         */
        static get definition() {
            return {
                icon: '👥',
                i18n: {
                    default: 'Groupe'
                }
            };
        }

        build() {
            const options = []
            const { values, value, placeholder, type, inline, other, toggle, ...data } = this.config
            const optionType = type.replace('-group', '')
            const isSelect = type === 'select'

            delete data.title

            for (let option in this.options.groupType.options) {
                const label = this.options.groupType.options[option]
                options.push(this.markup('option', document.createTextNode(label), {id: `group-${option}`, value: option}));
            }

            console.log('values', values);
            this.dom = this.markup(optionType, options, trimObj(data, true))
            return this.dom
        }

        /**
         * onRender callback
         */
        onRender() {
            // Set userData if available
            console.log('config', this.config)
            if (this.config.userData) {
                const selectedOptions = this.config.userData.slice()

                if (this.config.type === 'select') {
                    $(this.dom)
                        .val(selectedOptions)
                        .prop('selected', true)
                } else if (this.config.type.endsWith('-group')) {
                    if (this.config.type === 'checkbox-group') {
                        //clear all checked elements prior to setting them from userData
                        this.dom.querySelectorAll('input[type=checkbox]').forEach(input => {
                            input.removeAttribute('checked')
                        })
                    }
                    this.dom.querySelectorAll('input').forEach(input => {
                        if (input.classList.contains('other-val')) {
                            return
                        }

                        for (let i = 0; i < selectedOptions.length; i++) {
                            if (input.value === selectedOptions[i]) {
                                input.setAttribute('checked', 'checked')
                                selectedOptions.splice(i, 1) // Remove this item from the list
                                break
                            }
                        }

                        // Did not find a match for the selectedOption, see if this is an "other"
                        if (input.id.endsWith('-other') && selectedOptions.length > 0) {
                            const otherVal = this.dom.querySelector(`#${input.id}-value`)

                            // set the other value
                            input.setAttribute('checked', 'checked')
                            otherVal.value = input.value = selectedOptions[0]
                            // show other value
                            otherVal.style.display = 'inline-block'
                        }
                    })
                }
            }
        }
    }

    // register this control for the following types & text subtypes
    //controlClass.register('grouptest', GroupControl);
    return GroupControl;
});