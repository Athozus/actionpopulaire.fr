import React, { useState } from "react";
import { CustomProvider, DateRangePicker } from "rsuite";
import frFR from "rsuite/locales/fr_FR";
import styled, { createGlobalStyle, css } from "styled-components";
import PropTypes from "prop-types";
import { useMedia } from "react-use";

const customLocale = {
  ...frFR,
  DateRangePicker: {
    ...frFR.DateRangePicker,
    ok: "Valider",
    cancel: "Annuler",
  },
};

const BackgroundShadowMobile = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  ${({ $isWide, $isOpen }) =>
    !$isWide &&
    $isOpen &&
    css`
      width: 100vw;
      height: 100vh;
      background-color: #00000070;
    `}
`;

const RsPickerPopupStyle = createGlobalStyle`
    .rs-picker-header-date:first-child:before {
        content: "Du";
        margin-right: 4px;
    }
    .rs-picker-header-date:last-child:before {
        content: "Au";
        margin-right: 4px;
    }
    ${({ $isWide, $isOpen }) =>
      !$isWide &&
      $isOpen &&
      css`
        body {
          margin: 0;
          height: 100%;
          overflow: hidden;
        }
      `}
    ${({ $isWide }) =>
      !$isWide &&
      css`
        .rs-picker-popup {
          left: 0 !important;
          bottom: 0;
          top: initial !important;
          width: 100%;
          position: sticky !important;
        }
        .rs-calendar {
          min-height: 300px;
        }
        .rs-picker-daterange-content {
          width: 100vw;
        }
        .rs-btn-xs {
          font-size: 1.2rem;
        }
        .rs-calendar-table-cell-content {
          font-size: 1.3rem;
        }
        .rs-calendar-table-cell-selected::before,
        .rs-calendar-table-cell-in-range::before {
          height: 2rem;
        }
        .rs-picker-popup .rs-calendar .rs-calendar-table-cell-content {
          width: 2.5rem;
          height: 2.4rem;
        }
        .rs-stack {
          align-items: center !important;
          gap: 15px !important;
          justify-content: center;
          flex-direction: column;
        }
        .rs-btn {
          font-size: 1.1rem;
        }
        .rs-picker-header-date {
          padding: 8px 8px;
        }
        .rs-picker-toolbar-ranges {
          .rs-stack-item {
            width: 90%;
            text-align: center;
            button {
              width: 100%;
              color: ${(props) => props.theme.text1000};
              background-color: ${(props) => props.theme.text50};
              border-color: ${(props) => props.theme.text50};
              border-radius: ${(props) => props.theme.softBorderRadius};
            }
          }
          .rs-stack-item:last-child {
            // cancel button
            button {
              width: 100%;
              color: ${(props) => props.theme.error500};
              background-color: ${(props) => props.theme.text50};
              border-color: ${(props) => props.theme.background0};

              border-radius: ${(props) => props.theme.softBorderRadius};
            }
          }
        }
        .rs-picker-popup
          .rs-picker-daterange-panel-show-one-calendar
          .rs-picker-toolbar-ranges {
          width: 100vw;

          .rs-btn-sm {
            font-size: 1.2rem;
          }
        }
        .rs-picker-toolbar {
          justify-content: space-around;
          flex-direction: column;

          min-height: 260px;

          padding: 15px 0 16px 0 !important;

          button {
            padding: 8px 0 8px 0;
          }

          .rs-stack-item:last-child {
            // done button
            width: 90%;
            .rs-picker-toolbar-right {
              button {
                width: 100%;
              }
            }
          }
        }
      `}
`;

const StyledDateRangePicker = styled.div`
  border-radius: ${(props) => props.theme.softBorderRadius} !important;
  border: 1px solid ${(props) => props.theme.text100};
  div,
  input,
  span {
    border-radius: ${(props) => props.theme.softBorderRadius} !important;
    border: unset;
  }
  span {
    background-color: ${(props) => props.theme.background0} !important;
  }

  .rs-picker-toggle-wrapper {
    width: 100% !important;
  }

  i {
    font-size: 1.2em;
  }
`;

function CustomDateRangePicker(props) {
  const isWide = useMedia("(min-width: 1200px)");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CustomProvider locale={customLocale}>
      <BackgroundShadowMobile $isWide={isWide} $isOpen={isOpen} />
      <StyledDateRangePicker style={props.style}>
        <RsPickerPopupStyle $isWide={isWide} $isOpen={isOpen} />
        <DateRangePicker
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          caretAs={() => <i className="fa-regular fa-calendar" />}
          showOneCalendar={!isWide}
          {...props}
        />
      </StyledDateRangePicker>
    </CustomProvider>
  );
}

CustomDateRangePicker.propTypes = {
  style: PropTypes.object,
};

export default CustomDateRangePicker;
