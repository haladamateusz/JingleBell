import React from "react";

import type { NextPage } from "next";
import { MarketingSection } from "~/components/landing-page/MarketingSection";
import { TitleAndDropdown } from "~/components/landing-page/TitleAndDropdown";
import { TitleAndDropdownNew } from "~/components/landing-page/ImmediatlyCreateConversaion";

const LandingPage: NextPage = () => {
  return (
    <>
      <TitleAndDropdownNew />
      {/* <MarketingSection /> */}
    </>
  );
};
export default LandingPage;
