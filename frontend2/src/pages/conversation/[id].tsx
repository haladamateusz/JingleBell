import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { PdfFocusProvider } from "~/context/pdf";

import type { ChangeEvent } from "react";
import DisplayMultiplePdfs from "~/components/pdf-viewer/DisplayMultiplePdfs";
import { backendUrl } from "src/config";
import { MESSAGE_STATUS, Message, MessageSubProcess,
          NewMessage, ROLE, MessageSubprocessSource } from "~/types/conversation";
import useMessages from "~/hooks/useMessages";
import { backendClient } from "~/api/backend";
import { RenderConversations as RenderConversations } from "~/components/conversations/RenderConversations";
import { BiArrowBack } from "react-icons/bi";
import { SecDocument } from "~/types/document";
import { FiShare } from "react-icons/fi";
import ShareLinkModal from "~/components/modals/ShareLinkModal";
import { BsArrowUpCircle } from "react-icons/bs";
import { useModal } from "~/hooks/utils/useModal";
import { useIntercom } from "react-use-intercom";
import useIsMobile from "~/hooks/utils/useIsMobile";
import { v4 as uuidv4 } from "uuid";
import { getDateWithUTCOffset } from "~/utils/timezone";

export default function Conversation() {
  const router = useRouter();
  const { id } = router.query;

  const { shutdown } = useIntercom();
  useEffect(() => {
    shutdown();
  }, []);

  const { isOpen: isShareModalOpen, toggleModal: toggleShareModal } =
    useModal();

  const { isMobile } = useIsMobile();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMessagePending, setIsMessagePending] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<SecDocument[]>([]);
  const { messages, userSendMessage, systemSendMessage, setMessages } =
    useMessages(conversationId || "");

  const textFocusRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // router can have multiple query params which would then return string[]
    if (id && typeof id === "string") {
      setConversationId(id);
    }
  }, [id]);

  // useEffect(() => {
  //   const fetchConversation = async (id: string) => {
  //     const result = await backendClient.fetchConversation(id);
  //     if (result.messages) {
  //       setMessages(result.messages);
  //     }
  //     if (result.documents) {
  //       setSelectedDocuments(result.documents);
  //     }
  //   };
  //   if (conversationId) {
  //     fetchConversation(conversationId).catch(() =>
  //       console.error("Conversation Load Error")
  //     );
  //   }
  // }, [conversationId, setMessages]);

  // Keeping this in this file for now because this will be subject to change
  // const submit = () => {
  //   if (!userMessage || !conversationId) {
  //     return;
  //   }

  //   setIsMessagePending(true);
  //   userSendMessage(userMessage);
  //   setUserMessage("");

  //   const messageEndpoint =
  //     backendUrl + `api/getQuestion/`;
  //   const url = messageEndpoint //+ `?user_message=${encodeURI(userMessage)}`;

  //   const events = new EventSource(url);
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  //   events.onmessage = (event: MessageEvent) => {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
  //     const parsedData: Message = JSON.parse(event.data);
  //     systemSendMessage(parsedData);

  //     if (
  //       parsedData.status === MESSAGE_STATUS.SUCCESS ||
  //       parsedData.status === MESSAGE_STATUS.ERROR
  //     ) {
  //       events.close();
  //       setIsMessagePending(false);
  //     }
  //   };
  // };
  const mapResponseToMessage = (response: NewMessage) => {
    // Extract the fields you need from the response
    const { result, answer, question } = response;
  
    // Create the base message
    const message = {
      id: uuidv4(), // Generate a new id or use one from the response if available
      content: answer, // Assuming 'answer' is a string containing the content of the answer
      role: ROLE.USER,
      status: MESSAGE_STATUS.SUCCESS, // You might want to determine this based on the response
      conversationId, // This should be available in your current scope
      sub_processes: [] as MessageSubProcess[], // Initialize with an empty array if there are no sub-processes
      created_at: new Date(), // Set the current time
    };
  
    // If the 'result' is available and is an array, map it to your MessageSubProcess interface
    if (result && Array.isArray(result)) {
      message.sub_processes = result.map((item) => ({
        id: item.id, // Or generate new ID if necessary
        messageId: message.id, // This connects the subprocess with the parent message
        content: item.description, // Assuming 'description' contains the meaningful content
        source: MessageSubprocessSource.PLACEHOLDER, // If you don't have actual data for this, use placeholder
        metadata_map: {
          sub_question : {
            question: question,
            answer: item.description
          }
        }, // Initialize with an empty object or map actual fields if available
        // ADDED
        type: item.type,
        language: item.language,
        url: item.url,
        externalId: item.id
      }));
    }
    console.log("Lenght of subprocesses: ", message.sub_processes.length);
    return message;
  };
  const submit = async () => {
    if (!userMessage || !conversationId) {
      return;
    }
  
    setIsMessagePending(true);
    userSendMessage(userMessage);
  
    // Prepare the data to send
    const postData = {
      userId: conversationId,  // assuming conversationId is the userId
      question: userMessage,
    };
  
    // Define the URL to the new endpoint
    const url = backendUrl + 'askQuestion/';
  
    try {
      // Make a POST request with the user's message
      console.log("/POST: ", url);
      console.log("PostDATA: ", postData);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });  
      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Extract the JSON from the response
      const responseDataNew = await response.json();
      console.log("[RESPONSE]: ", responseDataNew);
      const responseData = mapResponseToMessage(responseDataNew);
      // Use the response in your system message
      systemSendMessage({
        ...responseData,
        id: uuidv4(),  // assuming you still want to generate a UUID for this message
        conversationId,
        role: ROLE.ASSISTANT,
        status: MESSAGE_STATUS.SUCCESS,  // or handle different statuses based on your logic
        created_at: getDateWithUTCOffset(),  // assuming the response doesn't include its own timestamp
      });
  
    } catch (error) {
      // Handle errors in sending message or receiving response
      console.error("There was an error sending the message", error);
  
      systemSendMessage({
        id: uuidv4(),
        conversationId,
        content: `Error`,  // or some user-friendly content
        role: ROLE.ASSISTANT,
        status: MESSAGE_STATUS.ERROR,
        created_at: getDateWithUTCOffset(),
      });
    } finally {
      setIsMessagePending(false);
      setUserMessage("");
    }
  };
  
  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUserMessage(event.target.value);
  };
  useEffect(() => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";

      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [userMessage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!isMessagePending) {
          submit();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [submit]);

  const setSuggestedMessage = (text: string) => {
    setUserMessage(text);
    if (textFocusRef.current) {
      textFocusRef.current.focus();
    }
  };

  useEffect(() => {
    if (textFocusRef.current) {
      textFocusRef.current.focus();
    }
  }, []);

  if (isMobile) {
    return (
      <div className="landing-page-gradient-1 relative flex h-screen w-screen items-center justify-center">
        <div className="flex h-min w-3/4 flex-col items-center justify-center rounded border bg-white p-4">
          <div className="text-center text-xl ">
            Sorry, the mobile view of this page is currently a work in progress.
            Please switch to desktop!
          </div>
          <button
            onClick={() => {
              router
                .push(`/`)
                .catch(() => console.log("error navigating to conversation"));
            }}
            className="m-4 rounded border bg-llama-indigo px-8 py-2 font-bold text-white hover:bg-[#3B3775]"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <PdfFocusProvider>
      <div className="flex h-[100vh] w-full items-center justify-center">
        <div className="flex h-[100vh] w-[44vw] flex-col items-center border-r-2 bg-white">
          <div className="flex h-[44px] w-full items-center justify-between border-b-2 ">
            <div className="flex w-full items-center justify-between">
              <button
                onClick={() => {
                  router
                    .push("/")
                    .catch(() => console.error("error navigating home"));
                }}
                className="ml-4 flex items-center justify-center rounded px-2 font-light text-[#9EA2B0] hover:text-gray-90"
              >
                <BiArrowBack className="mr-1" /> Back to Document Selection
              </button>
              <button
                onClick={toggleShareModal}
                className="mr-3 flex items-center justify-center rounded-full border border-gray-400 p-1 px-3 text-gray-400 hover:bg-gray-15"
              >
                <div className="text-xs font-medium">Share</div>
                <FiShare className="ml-1" size={12} />
              </button>
            </div>
          </div>
          <div className="flex max-h-[calc(100vh-114px)] w-[44vw] flex-grow flex-col overflow-scroll ">
            <RenderConversations
              messages={messages}
              documents={selectedDocuments}
              setUserMessage={setSuggestedMessage}
            />
          </div>
          <div className="relative flex h-[70px] w-[44vw] w-full items-center border-b-2 border-t">
            <textarea
              ref={textFocusRef}
              rows={1}
              className="box-border w-full flex-grow resize-none overflow-hidden rounded px-5 py-3 pr-10 text-gray-90 placeholder-gray-60 outline-none"
              placeholder={"Start typing your question..."}
              value={userMessage}
              onChange={handleTextChange}
            />
            <button
              disabled={isMessagePending || userMessage.length === 0}
              onClick={submit}
              className="z-1 absolute right-6 top-1/2 mb-1 -translate-y-1/2 transform rounded text-gray-90 opacity-80 enabled:hover:opacity-100 disabled:opacity-30"
            >
              <BsArrowUpCircle size={24} />
            </button>
          </div>
        </div>
        <div className="h-[100vh] w-max">
          <DisplayMultiplePdfs pdfs={selectedDocuments} />
        </div>
        <ShareLinkModal
          isOpen={isShareModalOpen}
          toggleModal={toggleShareModal}
        />
      </div>
    </PdfFocusProvider>
  );
}
