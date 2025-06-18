import React, {useEffect, useMemo, useState} from "react"
import {useDonationContext} from "@agir/donations/DonationContext";
import Button from "@agir/front/genericComponents/Button";
import styled from "styled-components";
import Spacer from "@agir/front/genericComponents/Spacer";
import {countRepartition, DON_TYPE, MAX_AMOUNT_DON, PAYMENT_TIMING} from "@agir/donations/Donation.domain";
import {useActiveContributionAPI} from "@agir/donations/common/api";
import DonationExisting from "@agir/donations/form/DonationExisting";
import {ErrorMessage, FormContainer} from "@agir/donations/Common.style";
import {useLocation} from "react-router-dom";
import { routeConfig } from "@agir/front/app/routes.config";
import DonationSubscriptionRenewWarning from "@agir/donations/form/DonationSubscriptionRenewWarning";
import CurrencyField from "@agir/front/formComponents/CurrencyField";

const DonationAmountContainer = styled.div`
    text-align: center;

    @media (max-width: ${(props) => props.theme.collapse}px) {
        padding-left: 1rem;
        padding-right: 1rem;
        
        button {
            font-weight: 500;
        }
    }
`

const AmountChoices = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    * {
        flex: 1 1 30%;
    }
`

const AmountAfterImpotParagraph = styled.p`
    text-align: center;
`

const AmountAfterImpot = styled.span`
    display: block;
    color: ${(props) => props.theme.success500};
    font-weight: bold;
    font-size: 2.2rem;
`

const Container = styled.div``
const ButtonTiming = styled.div``

const DEFAULT_AMOUNT = [0, 500, 1000, 1500, 3000, 5000, 10000]

export default function DonationAmount() {
    const location = useLocation()

    const { currentGroup, currentDonation, amount, paymentTiming, update, errors, updateExistingSubscription } = useDonationContext()
    const [customAmount, setCustomAmount] = useState(false)

    const { data: existingDonation, isLoading: isLoadingExistingDonation } = useActiveContributionAPI()

    function updateAmount(newAmount) {
        update({ ...countRepartition(newAmount, paymentTiming, currentGroup !== null) })
    }

    function amountAfterImpot() {
        const result = Math.floor(amount * 100 * 0.34) / 10000
        return result.toFixed(2).toString().replace(".", ",")
    }

    const AmountButton = useMemo(() => {
        return ({value}) => <Button
            active={amount === value}
            onClick={() => {
            setCustomAmount(false)
            updateAmount(value);
        }} color="lfi">{value / 100} €</Button>;
    }, [amount, paymentTiming])

    function updatePaymentTiming(timing) {
        update({
            paymentTiming: timing,
            ...countRepartition(amount, timing, currentGroup !== null)
        });
    }

    useEffect(() => {
        if (existingDonation && !currentDonation) {
            update({currentDonation: existingDonation})
        }
    }, [existingDonation]);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const isMonthly = location.pathname.includes("dons-mensuels") || urlParams.get("regularite") === "M"
        updatePaymentTiming(isMonthly
            ? PAYMENT_TIMING.MONTHLY
            : PAYMENT_TIMING.SINGLE_TIME)
        let amountParam = parseInt(urlParams.get("montant") ?? 0)
        amountParam = amountParam < 200 ? amountParam * 100 : amountParam
        if (DEFAULT_AMOUNT.includes(amountParam) === false) {
            setCustomAmount(true)
        }
        updateAmount(amountParam)
    }, [location]);

    return <Container>
        <ButtonTiming name="amount">
            <Button
                onClick={() => { updatePaymentTiming(PAYMENT_TIMING.SINGLE_TIME)}}
                active={paymentTiming === PAYMENT_TIMING.SINGLE_TIME}
                color="lfi">Don ponctuel</Button>
            <Button
                onClick={() => { updatePaymentTiming(PAYMENT_TIMING.MONTHLY) }}
                active={paymentTiming === PAYMENT_TIMING.MONTHLY}
                color="lfi">Don mensuel</Button>
        </ButtonTiming>

        <FormContainer>
            {updateExistingSubscription && paymentTiming === PAYMENT_TIMING.MONTHLY && <DonationSubscriptionRenewWarning subscription={existingDonation} />}
            {(existingDonation &&
                existingDonation.paymentTiming === PAYMENT_TIMING.MONTHLY &&
                !updateExistingSubscription &&
                paymentTiming === PAYMENT_TIMING.MONTHLY) ? <DonationExisting subscription={existingDonation} /> :
            <DonationAmountContainer>
                <ErrorMessage message={errors?.amount} display={errors?.amount} />
                {paymentTiming === PAYMENT_TIMING.SINGLE_TIME ? <p>Je fais un don une seule fois d'un montant de :</p> : <p>Je fais un don tous les mois d'un montant de :</p>}
                <AmountChoices>
                    <AmountButton value={500}/>
                    <AmountButton value={1000}/>
                    <AmountButton value={1500}/>
                    <AmountButton value={3000}/>
                    <AmountButton value={5000}/>
                    <AmountButton value={10000}/>
                    {customAmount ?
                        <CurrencyField
                            onChange={(value) => updateAmount(value)}
                            amount={amount / 100}
                            />
                        :
                        <Button
                            onClick={() => {
                                updateAmount(10000)
                                setCustomAmount(true);
                            }}
                            color="lfi">Montant personnalisé</Button>
                    }
                </AmountChoices>

                <Spacer size="1.2rem"/>
                {amount ?
                    <AmountAfterImpotParagraph>
                        <AmountAfterImpot>{amountAfterImpot()} € {paymentTiming === PAYMENT_TIMING.MONTHLY && "/ mois"}</AmountAfterImpot> après la réduction d'impôt sur le
                        revenu !
                    </AmountAfterImpotParagraph> :
                    <p>66 % de votre don est réduit de votre impôt sur le revenu.</p>}
            </DonationAmountContainer>
            }
        </FormContainer>
    </Container>


}