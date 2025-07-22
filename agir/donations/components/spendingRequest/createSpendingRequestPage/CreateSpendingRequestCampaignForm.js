import React from "react"
import CheckboxField from "@agir/front/formComponents/CheckboxField";
import SelectField from "@agir/front/formComponents/SelectField";
import {startCase} from "lodash";
import useSWR from "swr";
import {ENDPOINT} from "@agir/donations/spendingRequest/common/api";

const ELECTION_NONE = {value: "NONE", label: "Aucune"}

export default function CreateSpendingRequestCampaignForm({ data, isLoading, handleChangeCampaign, handleChange }) {

    const {
        data: elections,
        isLoading: electionsLoading,
    } = useSWR(ENDPOINT.electionsInProgressSpendingRequest);

    if (elections?.length === 0) {
        return null
    }

    return <>
        {(elections ?? []).length === 1 ? <CheckboxField
            toggle
            autoFocus
            disabled={isLoading && electionsLoading}
            id="campaign"
            name="campaign"
            value={data.campaign}
            onChange={handleChangeCampaign}
            label={`Il s’agit d’une dépense effectuée dans le cadre de la campagne pour les élections ${elections[0].toLowerCase()}.`}/>
            :
            <SelectField
                error=""
                id="election"
                label="Dans le cadre de quelle campagne ?"
                onChange={(e) => {
                    handleChangeCampaign(e !== ELECTION_NONE.value)
                    handleChange({target: {name: "election", value: e}});
                }}
                options={
                    (elections ?? []).map((e) => ({
                        value: e,
                        label: startCase(e.toLowerCase())
                    })).concat([ELECTION_NONE])
                }
                placeholder="Choisir une campagne si concernée"
                type="text"
                value={data.election ?? ELECTION_NONE}
            />
        }
        <hr/>
    </>
}