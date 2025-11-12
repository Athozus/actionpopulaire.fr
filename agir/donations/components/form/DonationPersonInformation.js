import React, {useEffect, useRef, useState} from "react"
import TextField from "@agir/front/formComponents/TextField";
import PhoneField from "@agir/front/formComponents/PhoneField";
import {useDonationContext} from "@agir/donations/DonationContext";
import styled from "styled-components";
import Button from "@agir/front/genericComponents/Button";
import CheckboxField from "@agir/front/formComponents/CheckboxField";
import {useSelector} from "@agir/front/globalContext/GlobalContext";
import {getIsConnected, getUser} from "@agir/front/globalContext/reducers";
import {AlertInformation, ErrorMessage, FormContainer} from "@agir/donations/Common.style";
import CustomField from "@agir/donations/common/CustomField";
import CountryField from "@agir/front/formComponents/CountryField";
import StaticToast from "@agir/front/genericComponents/StaticToast";
import Spacer from "@agir/front/genericComponents/Spacer";
import DepartementField from "@agir/front/formComponents/DepartementField";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import SearchAndSelectField, {useRemoteSearch} from "@agir/front/formComponents/SearchAndSelectField";
import {debounce} from "@agir/lib/utils/promises";
import DateTimeField from "@agir/front/formComponents/DateTimeField";
import Link from "@agir/front/app/Link";
import {useLocation} from "react-router-dom";

const Civilite = styled.div`
    display: flex;
    gap: 10px;
`

const Form = styled.form`
    display: flex;
    gap: 15px;
    flex-direction: column;


    h3::after {
        content: "*";
        color: ${({theme}) => theme.LFIsecondary500};
    }
`

export default function DonationPersonInformation() {

    const providerRef = useRef(new OpenStreetMapProvider(
        {
            params: {
                addressdetails: 1
            }
        }
    ))
    const [searchOptions, setSearchOptions] = useState([])
    const [searchIsLoading, setSearchIsLoading] = useState(false)
    const [disableSearch, setDisableSearch] = useState(false)
    const { pathname, search } = useLocation();
    const isConnected = useSelector(getIsConnected);

    const user = useSelector(getUser);
    const {
        firstName,
        email,
        lastName,
        dateOfBirth,
        gender,
        nationality,
        departement,
        contactPhone,
        honorCertified,
        locationCity,
        locationAddress1,
        locationCountry,
        update,
        frenchResident,
        errors,
        locationZip
    } = useDonationContext()

    useEffect(() => {
        if (!gender && (user?.gender || user?.firstName)) {
            update({
                gender: user.gender,
                firstName: user.firstName,
                lastName: user.lastName,
                dateOfBirth: user.dateOfBirth,
                email: user.email,
                contactPhone: user.contactPhone,
                locationAddress1: user.address1,
                locationCountry: user.country,
                locationCity: user.city,
                departement: user.departement,
                locationZip: user.zip
            })
        }
    }, [user, gender]);

    function _onChange(event) {
        update({[event.target.id]: event.target.value})
    }

    async function addresseChange(option = {}) {
        const rawAddress = option?.raw?.address
        update({
            locationAddress1: `${rawAddress?.house_number ?? ""} ${rawAddress?.road ?? ""}`,
            locationCity: rawAddress?.town ?? rawAddress?.municipality ?? rawAddress?.village ?? "",
            locationZip: rawAddress?.postcode ?? "",
            departement: rawAddress?.["ISO3166-2-lvl6"]?.split("-")?.[1] ?? rawAddress?.postcode?.substring(0, 2) ?? "",
            locationCountry: rawAddress?.["ISO3166-2-lvl6"]?.split("-")?.[0] ?? "FR"
        })
    }

    const onSearchAddress = debounce(async (searchTerm) => {
        setSearchIsLoading(true)
        setSearchOptions(undefined)
        const results = await providerRef.current.search({ query: searchTerm });
        setSearchIsLoading(false)
        const options = results.map((r) => ({
            ...r,
            value: r.label,
            label: r.label
        }))
        setSearchOptions(options)
        return options;
    }, 600)

    function disableSearchAddress() {
        setDisableSearch(true)
        setTimeout(() => {
            const input = document.getElementById("locationAddress1")
            input && input.focus()
            input && input.select()
        }, 700);
    }

    const currentDate = new Date()

    return <FormContainer>
        <h3>Mes informations</h3>
        {!isConnected && <AlertInformation center>
            Inscrit·e sur actionpopulaire ?
            <Link route="login" params={{ next: pathname + search }}> Se connecter</Link>
        </AlertInformation>}

        <Form>
            <span>
                <h3>Civilité</h3>
                <Civilite>
                <Button onClick={() => update({gender: "F"})} active={gender === "F"} color="lfi">Madame</Button>
                <Button onClick={() => update({gender: "M"})} active={gender === "M"} color="lfi">Monsieur</Button>
                </Civilite>
            </span>
            <TextField
                variant="lfi"
                id="firstName"
                label="Prénom"
                onChange={_onChange}
                value={firstName}
                name="firstName"
                error={errors?.firstName}
                required
            />
            <TextField
                variant="lfi"
                id="lastName"
                label="Nom"
                onChange={_onChange}
                value={lastName}
                name="lastName"
                error={errors?.lastName}
                required
            />
            <DateTimeField
                required
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={dateOfBirth}
                onChange={(val) => update({dateOfBirth: val})}
                error={errors?.dateOfBirth}
                label="Date de naissance"
                dateFieldProps={{
                    initialViewDate: currentDate.setFullYear(currentDate.getFullYear() - 18)
                }}
                placeholder="19/08/1951"
            />
            <CustomField
                variant="lfi"
                id="nationality"
                Component={CountryField}
                label="Nationalité"
                name="nationality"
                placeholder=""
                value={nationality}
                onChange={(value) => {
                    update({nationality: value, frenchResident: value === "FR"});
                }}
                error={errors?.nationality}
                helpText="Si double nationalité dont française, indiquez France"
                required
            />
            {nationality !== "FR" &&
                <div data-scroll="frenchResident">
                    <CheckboxField
                        variant="lfi"
                        id="frenchResident"
                        name="frenchResident"
                        label="Je certifie être domicilié⋅e fiscalement en France*"
                        value={frenchResident}
                        onChange={(e) => update({ frenchResident: e.target.checked })}
                    />
                    {errors?.frenchResident && (
                        <StaticToast style={{marginTop: "0.5rem"}}>
                            {errors?.frenchResident}
                        </StaticToast>
                    )}
                    <Spacer size="0.5rem"/>
                </div>
            }
            {(locationAddress1 || disableSearch) ?
                <TextField
                    variant="lfi"
                    id="locationAddress1"
                    label="Adresse"
                    onChange={_onChange}
                    value={locationAddress1}
                    error={errors?.locationAddress1}
                    required
                />
                :
                <SearchAndSelectField
                    isClearable
                    minSearchTermLength={2}
                    isLoading={searchIsLoading}
                    variant="lfi"
                    id="searchLocationAddress1"
                    label="Adresse"
                    onChange={addresseChange}
                    value={locationAddress1}
                    error={errors?.locationAddress1}
                    required
                    onSearch={onSearchAddress}
                    searchIcon={false}
                    placeholder={"Entrez votre adresse"}
                    defaultOptions={searchOptions}
                    helpText={<>Votre adresse n'apparaît pas ? <a onClick={disableSearchAddress}>Ajouter manuellement</a></>}
                />
            }
            <TextField
                variant="lfi"
                id="locationCity"
                label="Commune"
                onChange={_onChange}
                value={locationCity}
                error={errors?.locationCity}
                required
            />
            <CustomField
                Component={DepartementField}
                withCirconscriptionFE
                label="Département"
                name="departement"
                placeholder=""
                value={departement}
                onChange={(value) => update({departement: value})}
                error={errors?.departement}
                required
            />
            <TextField
                variant="lfi"
                id="locationZip"
                label="Code postal"
                onChange={_onChange}
                value={locationZip}
                error={errors?.locationZip}
                required
            />
            <CustomField
                variant="lfi"
                Component={CountryField}
                label="Pays "
                name="locationCountry"
                placeholder=""
                value={locationCountry}
                onChange={(value) => update({ locationCountry: value})}
                error={errors?.locationCountry}
                required
            />
            <PhoneField
                variant="lfi"
                label="Numéro de téléphone"
                id="contactPhone"
                name="Téléphone"
                onChange={_onChange}
                value={contactPhone}
                error={errors?.contactPhone}
                helpText="Nous sommes dans l'obligation de pouvoir vous contacter en cas de demande de vérification par la CNCCFP"
                required
            />
            <TextField
                variant="lfi"
                id="email"
                label="Adresse e-mail"
                placeholder="Adresse e-mail"
                onChange={_onChange}
                value={email}
                name="email"
                error={errors?.email}
                type="email"
                required
            />
            <div>
            <CheckboxField
                onChange={(e) => update({honorCertified: e.target.checked})}
                value={honorCertified}
                id="honorCertified"
                name="honorCertified"
                label="Je certifie sur l'honneur être une personne physique et que le règlement de mon don ne provient pas d'une personne morale (association, société, société civile...) mais de mon compte bancaire personnel.*"
                variant="lfi"
                required
            />
                <ErrorMessage message={errors?.honorCertified} display={errors?.honorCertified} />
            </div>
        </Form>
    </FormContainer>
}