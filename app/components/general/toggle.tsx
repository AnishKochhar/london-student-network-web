import Image from "next/image";
import React from "react";

type CollapsibleToggleProps = {
  show: boolean;
  onClick: () => void;
  labelShow: string;
  labelHide: string;
};

export const CollapsibleToggle: React.FC<CollapsibleToggleProps> = ({
  show,
  onClick,
  labelShow,
  labelHide,
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1"
    aria-label={show ? labelHide : labelShow} // Added aria-label for better accessibility
  >
    <span>{show ? labelHide : labelShow}</span> {/* Replaced <p> with <span> */}
    <Image
      src={show ? "/icons/collapse-arrow-up.png" : "/icons/collapse-arrow-down.png"}
      alt={show ? "Collapse up" : "Collapse down"} // Providing alternative text for the image
      width={16}
      height={16}
    />
  </button>
);
