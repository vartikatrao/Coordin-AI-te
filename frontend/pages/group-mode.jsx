import React from "react";
import GroupMode from "@/components/GroupMode/GroupMode";
import UnifiedNavbar from "@/components/Navbar/UnifiedNavbar";

const GroupModePage = () => {
  return (
    <>
      <UnifiedNavbar showModeNavigation={true} />
      <GroupMode />
    </>
  );
};

export default GroupModePage;

