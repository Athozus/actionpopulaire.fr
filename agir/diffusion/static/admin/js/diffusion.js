const COUNTER_ID = "message-counter"
const UNIT_SMS_PRICE = 0.06
let segmentSize = -1;
const STOP_SUBSCRIBE = "STOP au <#shortcode#>"

function appendCounter(area) {
    const counter = document.createElement("div")
    counter.id = COUNTER_ID

    counter.style.padding = "15px"

    area.parentElement.append(counter)
    updateCounter()
}

function appendStopShortcodeButton() {
    const messageHelper = document.getElementById("id_message_helptext")
    const button = document.createElement("a")
    button.style = `display: flex;
        justify-content: center;
        width: 160px;
        align-items: center;
        height:30px;
        cursor:pointer;
        color:white;
        border-radius:8px;
        background:#571aff;
        font-weight:bold;`
    button.innerText = "Ajouter STOP shortcode"
    messageHelper.append(button)

    button.addEventListener("click", () => {
        getMessageArea().value = getMessageArea().value + STOP_SUBSCRIBE
        updateCounter()
    })
}

function getCounter() {
    return document.getElementById(COUNTER_ID)
}

function updateCounter() {
    const charAmount = document.getElementById("id_message")?.value?.length ?? 0

    let coutText = "Chargement du coût, assurez-vous d'avoir sélectionner un Segment et d'avoir sauvegarder.."
    const amount_sms = Math.floor(charAmount/160) + 1
    if (segmentSize !== -1) {
        coutText = `Coût estimé : ${UNIT_SMS_PRICE * segmentSize * amount_sms} €`
    }

    getCounter().innerText = `
    Nombre de caractères : ${charAmount}/160
    Nombre estimé de SMS : ${amount_sms}
    ${coutText}
    `
}

function listenCounter(area) {
    area.addEventListener("input", updateCounter)
}

function updateSegmentSize(element, env = "") {
    if (element.innerText.includes("Chargement") === false) {
        segmentSize = parseInt(element.innerText)
        if (segmentSize === 0) {
            disableActions(env)
        }
    }
}

function getSegmentSizeElement() {
    return document.getElementById("segment-size")
}

function getTestSegmentSizeElement() {
    return document.getElementById("segment-size-test")
}

function getMessageArea() {
    return document.getElementById("id_message")
}

function disableActions(env) {
    const actionButtons = document.getElementsByClassName(`action${env ? `-${env}` : ""}`)
    let lastButton = undefined
    Array.from(actionButtons).forEach(button => {
        button.setAttribute("disabled", "");
        lastButton = button
    })
    if (lastButton) {
        const p = document.createElement("p")
        p.innerText = "Votre segment contient aucune personne, vous ne pouvez faire aucune action, sélectionnez un segment avec au moins une personne."
        lastButton.parentElement.appendChild(p)
    }
}

document.addEventListener("DOMContentLoaded", (event) => {
    const messageArea = getMessageArea()
    if (messageArea) {
        appendCounter(messageArea)
        appendStopShortcodeButton()
        listenCounter(messageArea)
    }

    const observer = new MutationObserver(() => {
        updateSegmentSize(getSegmentSizeElement())
        updateCounter()
    });
    const observerTest = new MutationObserver(() => {
        updateSegmentSize(getTestSegmentSizeElement(), "test")
    })
    observer.observe(getSegmentSizeElement(), { childList: true });
    observerTest.observe(getTestSegmentSizeElement(), { childList: true });

    setInterval(() => {

    })

});
