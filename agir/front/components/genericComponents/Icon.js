import React from "react";
import { RawFeatherIcon } from "@agir/front/genericComponents/FeatherIcon";
import PropTypes from "prop-types";

function Icon({ name }) {
  if (!name) {
    return null;
  }

  return name?.includes("fa-") ? (
    <i className={`fa-regular ${name}`} />
  ) : (
    <RawFeatherIcon width="1rem" height="1rem" name={name} />
  );
}

Icon.propTypes = {
  name: PropTypes.string,
};

export default Icon;
