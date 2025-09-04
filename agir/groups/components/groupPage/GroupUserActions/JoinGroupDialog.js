import PropTypes from "prop-types";
import React from "react";

import Button from "@agir/front/genericComponents/Button";
import ModalConfirmation from "@agir/front/genericComponents/ModalConfirmation";
import ShareLink from "@agir/front/genericComponents/ShareLink";
import Spacer from "@agir/front/genericComponents/Spacer";
import StyledDialog from "./StyledDialog";

export const JoinGroup = (props) => {
  const {
    step,
    isLoading,
    groupName,
    groupReferents,
    personName,
    onJoin,
    onUpdate,
    onClose,
    joinGroupMessageId,
    openMessageModal,
    groupContact,
    personalInfoConsent
  } = props;

  switch (step) {
    case 1:
      return (
        <StyledDialog>
          <header>
            <h3>Rejoindre {groupName}</h3>
          </header>
          <article>
            Les animateur·ices seront informé·es de votre arrivée et vous
            pourrez rencontrer les membres du groupe&nbsp;!
          </article>
          <footer>
            <Button
              disabled={isLoading}
              loading={isLoading}
              onClick={onJoin}
              color="primary"
              block
              wrap
            >
              Je rejoins&nbsp;!
            </Button>
            <Button disabled={isLoading} onClick={onClose} block wrap>
              Annuler
            </Button>
          </footer>
        </StyledDialog>
      );
    case 2: {
      let referentNames = groupReferents
        .map((referent, i) => {
          if (i === 0) {
            return referent.displayName;
          }
          if (i === groupReferents.length - 1) {
            return " et " + referent.displayName;
          }
          return ", " + referent.displayName;
        })
        .join("");

      const givePersonalInfoConsent = () =>
        onUpdate({ personalInfoConsent: true });

      const denyPersonalInfoConsent = () =>
        onUpdate({ personalInfoConsent: false });

      return (
        <StyledDialog>
          <header>
            <h3>Bienvenue dans le groupe, {personName}&nbsp;!&nbsp;👍</h3>
          </header>
          <article>
            <strong>
              Faites la rencontre avec {referentNames} qui animent ce groupe.
            </strong>
            <Spacer size=".5rem" />
            Partagez vos coordonnées (nom complet, téléphone et adresse) avec
            eux pour qu'ils puissent prendre contact avec vous en dehors d'Action Populaire.
            <Spacer size=".5rem" />
            Vous pourrez retirer cette autorisation à tout moment. C'est
            maintenant que tout se joue&nbsp;!
          </article>
          <footer>
            <Button
              disabled={isLoading}
              loading={isLoading}
              onClick={givePersonalInfoConsent}
              block
              wrap
            >
              Partager mes coordonnées avec {referentNames}
            </Button>
            <Button
              disabled={isLoading}
              onClick={denyPersonalInfoConsent}
              block
              wrap
            >
              Passer cette étape
            </Button>
          </footer>
        </StyledDialog>
      );
    }
    case 3: {
      return joinGroupMessageId ?
          <WelcomeForGroupWithMessage onClose={onClose} isLoading={isLoading}/> :
          <WelcomeForGroupWithoutMessage
              onClose={onClose}
              isLoading={isLoading}
              openMessageModal={openMessageModal}
              personalInfoConsent={personalInfoConsent}
              groupContact={groupContact} />
    }
    default:
      return null;
  }
};

function WelcomeForGroupWithoutMessage({onClose, isLoading, groupContact, openMessageModal, personalInfoConsent}) {
  const canContact = !!openMessageModal || !!groupContact?.email;
  return (
      <StyledDialog>
        <header>
          {canContact ? (
              <h3>Présentez-vous&nbsp;!</h3>
          ) : (
              <h3>Bienvenue&nbsp;!</h3>
          )}
        </header>
        <article>
          <strong>
            C’est noté ! Les gestionnaires du groupe pourront vous contacter
            sur la messagerie d’Action Populaire,{" "}
            {personalInfoConsent
                ? "par e-mail et par téléphone"
                : "et par e-mail"}
            .
          </strong>
          {canContact ? (
              <>
                <Spacer size=".5rem" />
                Envoyez-leur un message pour vous présenter&nbsp;:
                <Spacer size="1rem" />
                <footer>
                  {openMessageModal ? (
                      <Button
                          color="primary"
                          block
                          wrap
                          onClick={openMessageModal}
                          icon="mail"
                      >
                        Je me présente&nbsp;!
                      </Button>
                  ) : (
                      <ShareLink
                          label="Copier"
                          color="primary"
                          url={groupContact?.email}
                          $wrap
                      />
                  )}
                  <Button disabled={isLoading} onClick={onClose} block wrap>
                    Plus tard
                  </Button>
                </footer>
              </>
          ) : (
              <>
                <Spacer size="1rem" />
                <footer>
                  <Button disabled={isLoading} onClick={onClose} block wrap>
                    J'ai compris
                  </Button>
                </footer>
              </>
          )}
        </article>
      </StyledDialog>
  )
}

function WelcomeForGroupWithMessage({onClose, isLoading}) {
  return <StyledDialog>
    <header>
      <h3>Bienvenue&nbsp;!</h3>
    </header>
    <article>
      <p>
        <strong>
          Pour commencer vous allez être mis en lien avec les animateur·ices du groupe sur Action Populaire !
        </strong>
      </p>
      <Button color="primary" disabled={isLoading} onClick={onClose} block wrap>
        Terminer
      </Button>
    </article>
  </StyledDialog>

}

JoinGroup.propTypes = {
  step: PropTypes.number.isRequired,
  isLoading: PropTypes.bool,
  personName: PropTypes.string.isRequired,
  groupName: PropTypes.string.isRequired,
  groupReferents: PropTypes.arrayOf(
    PropTypes.shape({
      displayName: PropTypes.string.isRequired,
    }),
  ).isRequired,
  groupContact: PropTypes.shape({
    email: PropTypes.string,
  }),
  personalInfoConsent: PropTypes.bool,
  onJoin: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  openMessageModal: PropTypes.func,
};

const JoinGroupDialog = (props) => {
  const { step, isLoading, onClose } = props;

  return (
    <ModalConfirmation
      shouldShow={step > 0}
      onClose={!isLoading ? onClose : undefined}
      shouldDismissOnClick={false}
    >
      <JoinGroup {...props} />
    </ModalConfirmation>
  );
};

JoinGroupDialog.propTypes = {
  step: PropTypes.number.isRequired,
  isLoading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default JoinGroupDialog;
