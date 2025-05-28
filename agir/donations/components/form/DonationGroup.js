import React, {useEffect, useMemo, useState} from "react"
import CheckboxField from "@agir/front/formComponents/CheckboxField";
import SelectField from "@agir/front/formComponents/SelectField";
import {useGroupDonation} from "@agir/donations/common/hooks";
import {useLocation} from "react-router-dom";
import {Row} from "@agir/front/genericComponents/grid";
import {useDonationContext} from "@agir/donations/DonationContext";
import {AlertInformation, FormContainer} from "@agir/donations/Common.style";
import PageFadeIn from "@agir/front/genericComponents/PageFadeIn";
import Skeleton from "@agir/front/genericComponents/Skeleton";
import styled from "styled-components";
import {useSelector} from "@agir/front/globalContext/GlobalContext";
import {getIsConnected} from "@agir/front/globalContext/reducers";
import Link from "@agir/front/app/Link";

const TitleDonationGroup = styled.h3`
    cursor: pointer;
`

export default function DonationGroup() {

    const { search } = useLocation();
    const urlParams = new URLSearchParams(search);
    const {currentGroup, hasSelectedGroup, update} = useDonationContext()
    const [selectedGroup, setSelectedGroup] = useState(false)

    const isConnected = useSelector(getIsConnected);

    const groupId = urlParams.get("group")
    const { group, groups } = useGroupDonation(
        groupId,
        true,
    );

    const [open, setOpen] = useState(!!groupId)

    const groupChoices = useMemo(
        () =>
            Array.isArray(groups)
                ? groups.map((g) => ({ ...g, value: g.id, label: g.name }))
                : [],
        [groups],
    );

    function setupSelectedGroup(fromGroup) {
        const newGroup = groupChoices.find((g) => g.id === fromGroup.id)
        if (newGroup) {
            update({currentGroup: newGroup, hasSelectedGroup: true})
            setSelectedGroup(newGroup)
        } else {
            update({hasSelectedGroup: false})
        }
    }

    useEffect(() => {
        if (group && !currentGroup) {
            setupSelectedGroup(group)
        }
    }, [group, groups]);

    useEffect(() => {
        if (currentGroup && hasSelectedGroup && !open) {
            setOpen(true)
            setupSelectedGroup(currentGroup)
        }
    }, [currentGroup, hasSelectedGroup, open]);

    const ready =  ((groupId !== null && selectedGroup !== null) || groupId === null)

    function toggleOpen() {
        update({ hasSelectedGroup: !open})
        setOpen((old) => !old);
    }

    return <FormContainer>
        <Row gutter={0} justify="space-between" gap={10}>
            <TitleDonationGroup onClick={toggleOpen}>Donner à un groupe en particulier</TitleDonationGroup>
            <CheckboxField
                id="group"
                name="group"
                value={open}
                onChange={toggleOpen}
                toggle
                variant="lfi"
            />
        </Row>
        <PageFadeIn ready={ready} wait={<Skeleton boxes={1}/>}>
        {open &&
            <>
            {isConnected ?
            <div>
                <p>Séléctionner un groupe certifié</p>
                <SelectField
                    label=""
                    helpText=""
                    name="group"
                    placeholder="Selectionnez un groupe d'action certifié"
                    value={selectedGroup}
                    options={groupChoices}
                    onChange={(_group) => {
                        setSelectedGroup(_group);
                        update({currentGroup: _group});
                    }}
                    small
                />
            </div> : <MustBeAuth/>}
            </>
        }
        </PageFadeIn>
    </FormContainer>
}

function MustBeAuth() {
    const { pathname, search } = useLocation();

    return <AlertInformation center>
        Vous devez être connecté·e pour donner à un groupe.<br />
        <Link route="login" params={{ next: pathname + search }}>Se connecter</Link>
    </AlertInformation>
}