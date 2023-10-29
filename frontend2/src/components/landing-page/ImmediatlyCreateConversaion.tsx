import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { backendClient } from "~/api/backend";

export const TitleAndDropdownNew = () => {
  const router = useRouter();
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const handleSubmit = () => {
    setIsLoadingConversation(true);
    // Note: selectedDocumentIds is empty for the purpose of this example
    const selectedDocumentIds: string[] = [];
    backendClient
      .createConversation(selectedDocumentIds)
      .then((newConversationId) => {
        setIsLoadingConversation(false);
        router
          .push(`/conversation/${newConversationId}`)
          .catch(() => console.error("error navigating to conversation"));
      })
      .catch(() => {
        setIsLoadingConversation(false);
        console.error("error creating conversation");
      });
  };

  // Using the useEffect hook to call handleSubmit immediately after component mount
  useEffect(() => {
    handleSubmit();
  }, []);

  // We're not rendering anything since this component is now solely for redirection
  return null;
};
