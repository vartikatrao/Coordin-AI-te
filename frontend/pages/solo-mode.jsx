import React from "react";
import SoloMode from "@/components/SoloMode/SoloMode";
import UnifiedNavbar from "@/components/Navbar/UnifiedNavbar";

const SoloModePage = () => {
  return (
    <>
      <UnifiedNavbar showModeNavigation={true} />
      <SoloMode />
    </>
  );
};

export default SoloModePage;
