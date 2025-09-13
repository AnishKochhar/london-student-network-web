import Image from "next/image";
import React from "react";
import { Button } from '@/app/components/button';


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
  <Button
    variant="ghost"
    onClick={onClick}
    aria-label={show ? labelHide : labelShow}
  >
    <span>{show ? labelHide : labelShow}</span>
    <Image
      src={show ? "/icons/collapse-arrow-up.png" : "/icons/collapse-arrow-down.png"}
      alt={show ? "Collapse up" : "Collapse down"}
      width={16}
      height={16}
    />
  </Button>
);
