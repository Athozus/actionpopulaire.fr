import React, {useEffect, useRef, useState} from "react";
import TextField from "@agir/front/formComponents/TextField";


export default function CurrencyField({ amount, onChange, readOnly = false, error = "", ...rest }) {
    const [currentValue, setCurrentValue] = useState(amount)
    const amountRef = useRef()

    function _onChange(e) {
        let value = e.target.value?.trim().replace(/[^0-9,.]/g, "").replace(".", ",")

        if (value === "") {
            setCurrentValue(value)
            return
        }
        setCurrentValue(value)
        amountRef.current = value
        if (value.includes(",")) {
            const lengthAfterComma = value.split(",")[1].length
            if (lengthAfterComma === 1) {
                onChange(parseInt(value.replace(",", "")) * 10)
            } else if (lengthAfterComma === 2) {
                onChange(parseInt(value.replace(",", "")))
            }
        } else {
            onChange(parseInt(value) * 100)
        }
    }

    useEffect(() => {
        if (amount !== amountRef) {
            setCurrentValue(amount)
        }
    }, [amount]);

    return <TextField
        readOnly={readOnly}
        icon="euro-sign"
        onChange={_onChange}
        error={error}
        iconRight
        value={currentValue.toString().replace(".", ",")}
        {...rest}
    />
}