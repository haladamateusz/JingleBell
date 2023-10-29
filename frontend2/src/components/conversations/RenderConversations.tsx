import React, { useEffect, useRef, useState } from "react";
import { MESSAGE_STATUS, MessageSubProcess, ROLE } from "~/types/conversation";
import type { Citation } from "~/types/conversation";
import type { Message, SubQuestion } from "~/types/conversation";
import { LoadingSpinner } from "~/components/basics/Loading";
import { PiCaretDownBold } from "react-icons/pi";
import { HiOutlineChatAlt2 } from "react-icons/hi";
import { usePdfFocus } from "~/context/pdf";
import { AiFillExclamationCircle, AiOutlineLink } from "react-icons/ai";
import { SecDocument } from "~/types/document";
import { borderColors } from "~/utils/colors";
import { formatDisplayDate } from "~/utils/timezone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";

interface CitationDisplayProps {
  citation: Citation;
}

interface FeedbackProps {
  previousQuestion: string | undefined;
  previousResults: MessageSubProcess[] | undefined; // You can specify the type for previousResults
  userId: string;
}

const HandleFeedback: React.FC<FeedbackProps> = ({
  previousQuestion,
  previousResults,
  userId,
}) => {

  const handleFeedbackOkay = () => {
    handleFeedback("thumbsUp");
  };

  const handleFeedbackNotOkay = () => {
    handleFeedback("thumbsDown");
  };

  const handleFeedback = (feedbackType: string) => {
    const endpoint = "http://127.0.0.1:8000/sendFeedback/";

    // Define the feedback value based on the feedbackType
    const feedback = feedbackType === "thumbsUp" ? "OKAY" : "BAD_GPT";

    // Create the request body
    const requestBody = {
      previousQuestion,
      previousResults,
      feedback,
      userId,
    };

    // Make the POST request
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        // Handle the response if needed
        return response.json();
      })
      .then((data) => {
        // Handle the data returned from the server if needed
        console.log("Feedback sent successfully:", data);
      })
      .catch((error) => {
        // Handle errors here
        console.error("Error sending feedback:", error);
      });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div className="flex items-center mt-2">
        {/* <div className="text-[11px] text-gray-60">
          Note: Use thumbs up and down to rate the displayed response.
        </div> */}
        <button onClick={handleFeedbackOkay} className="pr-2">
          <FontAwesomeIcon icon={faThumbsUp} style={{ fontSize: '24px' }}/>
        </button>
        <button onClick={handleFeedbackNotOkay} className="pr-2">
          <FontAwesomeIcon icon={faThumbsDown} style={{ fontSize: '24px' }} />
        </button>
      </div>
    </div>
  );
};


const CitationDisplay: React.FC<CitationDisplayProps> = ({ citation }) => {
  const { setPdfFocusState } = usePdfFocus();
  const handleCitationClick = (documentId: string, pageNumber: number) => {
    setPdfFocusState({ documentId, pageNumber, citation });
  };

  return (
    <div
      className={`mx-1.5 mb-2 min-h-[25px] min-w-[160px] cursor-pointer rounded border-l-8 bg-gray-00 p-1 hover:bg-gray-15  ${
        borderColors[citation.color]
      }`}
      onClick={() =>
        handleCitationClick(citation.documentId, citation.pageNumber)
      }
    >
      <div className="flex items-center">
        <div className="mr-1 text-xs font-bold text-black">
          {citation.ticker}{" "}
        </div>
        <div className="mr-2 text-xs font-bold text-black">
          ({citation.displayDate})
        </div>
        <div className="text-[10px]">p. {citation.pageNumber}</div>
      </div>
      <p className="line-clamp-2 text-[10px] font-light leading-3">
        {citation.snippet}
      </p>
    </div>
  );
};

interface SubProcessDisplayProps {
  subProcesses: MessageSubProcess[];
  isOpen: boolean;
  toggleOpen: () => void;
  messageId: string;
  showSpinner: boolean;
  documents: SecDocument[];
}

type SubQuestionItem = {
  subQuestion: SubQuestion,
  subProcessIndex: number,
  subQuestionIndex: number
};

type ChunkItem = {
  content: string,
  chunkIndex: number,
  url: string
};

const SubProcessDisplayNew: React.FC<SubProcessDisplayProps> = ({
  subProcesses,
  isOpen,
  toggleOpen,
  messageId,
  documents,
  showSpinner = true,
}) => {
  const subQuestions: ChunkItem[] = [];
  subProcesses?.forEach((subProcess, chunkIndex) => {
    if (subProcess.url) {
      subQuestions.push({
        content: subProcess.content,
        chunkIndex,
        url: subProcess.url,
      });
    } else {
      subQuestions.push({
        content: subProcess.content,
        chunkIndex,
        url: "",
      });
    }
  });
  console.log("SubQuestionItem :", subQuestions.length);
  return (
    <div key={`${messageId}-sub-process`} className="mt-4 w-full rounded ">
      <div
        className="flex w-max cursor-pointer items-center rounded p-1 font-nunito text-sm text-gray-90 hover:bg-gray-00"
        onClick={() => toggleOpen()}
      >
        View progress
        <div className="px-3 py-2">
          {isOpen ? (
            <PiCaretDownBold />
          ) : (
            <PiCaretDownBold className="-rotate-90" />
          )}
        </div>
      </div>
      {isOpen && (
        <>
          <div className="ml-4 border-l border-l-gray-30 pb-1 pl-4 font-nunito text-[11px] font-light text-gray-60">
            <div>Question Received</div>
            {subQuestions.length > 0 && (
                <div
                  key={`${messageId}-sub-process`}
                  className="text-gray-60"
                >
                  <div>
                    {subQuestions.map(({content, chunkIndex, url}) => {
                      return (
                        <div
                          key={`${messageId}-${chunkIndex}`}
                        >
                          Retrieved document #{chunkIndex + 1}{" "}
                          <div className="flex w-11/12 flex-col rounded border">
                            <div className="rounded-t border-b bg-gray-00 p-2 font-bold text-gray-90">
                              {content}
                            </div>
                              <div className="overflow-scroll p-2 text-[11px] font-semibold text-red-500">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  Open page
                                </a>
                              </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </div>
          {showSpinner && (
            <div className="ml-2.5 mt-1 ">
              <LoadingSpinner />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SubProcessDisplay: React.FC<SubProcessDisplayProps> = ({
  subProcesses,
  isOpen,
  toggleOpen,
  messageId,
  documents,
  showSpinner = true,
}) => {
  const subQuestions: SubQuestionItem[] = [];
  subProcesses?.forEach((subProcess, subProcessIndex) => {
    if (subProcess.metadata_map?.sub_question) {
      subQuestions.push({
        subQuestion: subProcess.metadata_map?.sub_question,
        subProcessIndex,
        subQuestionIndex: subQuestions.length,
      });
    } else if (subProcess.metadata_map?.sub_questions) {
      subProcess.metadata_map?.sub_questions.forEach((subQuestion) => {
        subQuestions.push({
          subQuestion,
          subProcessIndex,
          subQuestionIndex: subQuestions.length,
        });
      });
    }
  });
  console.log("SubQuestionItem :", subQuestions.length);
  return (
    <div key={`${messageId}-sub-process`} className="mt-4 w-full rounded ">
      <div
        className="flex w-max cursor-pointer items-center rounded p-1 font-nunito text-sm text-gray-90 hover:bg-gray-00"
        onClick={() => toggleOpen()}
      >
        View progress
        <div className="px-3 py-2">
          {isOpen ? (
            <PiCaretDownBold />
          ) : (
            <PiCaretDownBold className="-rotate-90" />
          )}
        </div>
      </div>
      {isOpen && (
        <>
          <div className="ml-4 border-l border-l-gray-30 pb-1 pl-4 font-nunito text-[11px] font-light text-gray-60">
            <div>Question Received</div>
            {subQuestions.length > 0 && (
                <div
                  key={`${messageId}-sub-process`}
                  className="text-gray-60"
                >
                  <div>
                    {subQuestions.map(({subQuestion, subQuestionIndex, subProcessIndex}) => {
                      const hasCitations = !!subQuestion.citations;
                      return (
                        <div
                          key={`${messageId}-${subProcessIndex}-${subQuestionIndex}`}
                        >
                          Generated Sub Query #{subQuestionIndex + 1}{" "}
                          <div className="flex w-11/12 flex-col rounded border">
                            <div className="rounded-t border-b bg-gray-00 p-2 font-bold text-gray-90">
                              {subQuestion.question}
                            </div>
                            <div className="overflow-scroll p-2 text-[11px] font-light">
                              {subQuestion.answer}
                            </div>

                            {hasCitations && (
                              <div className=" mr-2 flex w-full overflow-x-scroll pl-2 ">
                                {subQuestion.citations?.map(
                                  (citation, citationIndex) => {
                                    // get snippet and dispaly date from documentId
                                    const citationDocument = documents.find(
                                      (doc) => doc.id === citation.document_id
                                    );
                                    if (!citationDocument) {
                                      return;
                                    }
                                    const yearDisplay =
                                      citationDocument.quarter
                                        ? `${citationDocument.year} Q${citationDocument.quarter}`
                                        : `${citationDocument.year}`;
                                    return (
                                      <CitationDisplay
                                        key={`${messageId}-${subProcessIndex}-${subQuestionIndex}-${citationIndex}`}
                                        citation={
                                          {
                                            documentId: citation.document_id,
                                            snippet: citation.text,
                                            pageNumber: citation.page_number,
                                            ticker: citationDocument?.ticker,
                                            displayDate: yearDisplay,
                                            color: citationDocument.color,
                                          } as Citation
                                        }
                                      />
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </div>
          {showSpinner && (
            <div className="ml-2.5 mt-1 ">
              <LoadingSpinner />
            </div>
          )}
          <div className="pb-2"></div>
        </>
      )}
    </div>
  );
};


interface UserDisplayProps {
  message: Message;
  showLoading: boolean;
}
const UserDisplay: React.FC<UserDisplayProps> = ({ message, showLoading }) => {
  return (
    <>
      <div className="flex border-r bg-gray-00 pb-4">
        <div className="mt-4 w-1/5 flex-grow text-right font-nunito text-gray-60">
          <div className="flex items-center justify-center">
            {formatDisplayDate(message.created_at)}
          </div>
        </div>
        <div className="mt-4 w-4/5 pr-3 font-nunito font-bold text-gray-90">
          {message.content}
        </div>
      </div>
      {showLoading && (
        <div className="flex border-b-2 pb-4">
          <div className="w-1/5"></div>
          <div className="w-4/5">
            <SubProcessDisplayNew
              key={`${message.id}-loading-sub-process`}
              messageId={message.id}
              subProcesses={[]}
              isOpen={true}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              toggleOpen={() => {}}
              showSpinner={true}
              documents={[]}
            />
          </div>
        </div>
      )}
    </>
  );
};

const ErrorMessageDisplay = () => {
  return (
    <div className="mt-2 flex w-80 items-center rounded border border-red-500 bg-red-100 bg-opacity-20 p-1">
      <div className="ml-2">
        <AiFillExclamationCircle className="fill-red-500" size={20} />
      </div>
      <div className="ml-4 text-red-400">
        Error: unable to load chat response
      </div>
    </div>
  );
};

interface AssistantDisplayProps {
  message: Message;
  documents: SecDocument[];
}
const AssistantDisplay: React.FC<AssistantDisplayProps> = ({
  message,
  documents,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isMessageSuccessful = message.status === MESSAGE_STATUS.SUCCESS;
  const isMessageError = message.status === MESSAGE_STATUS.ERROR;

  useEffect(() => {
    if (isMessageSuccessful) {
      setIsExpanded(true);
    }
  }, [isMessageSuccessful]);
  return (
    <div className="border-b pb-4">
      <div className="flex ">
        <div className="w-1/5"></div>
        <div className="w-4/5">
          {!isMessageError && (
            <div className="flex flex-col">
              <SubProcessDisplayNew
                key={`${message.id}-sub-process`}
                subProcesses={message.sub_processes || []}
                isOpen={isExpanded}
                toggleOpen={() => setIsExpanded((prev) => !prev)}
                showSpinner={!isMessageSuccessful}
                messageId={message.id}
                documents={documents}
              />
            </div>
          )}
          {isMessageError && <ErrorMessageDisplay />}
        </div>
      </div>

      {!isMessageError && (
        <>
          <div className="flex items-center justify-center">
            <div className="my-3 w-11/12 border-[.5px]"></div>
          </div>
          <div className="flex ">
            <div className="w-1/5"></div>
            <div className="w-4/5">
              <p className="relative mb-2 mt-2 pr-3 font-nunito whitespace-pre-wrap font-bold text-gray-90">
                {message.content}
              </p>
              <div className="flex items-center justify-between p-1">
                  <p className="text-xs text-gray-60">
                    This statement is served to you by JingleBells
                  </p>
                  <HandleFeedback
                    previousQuestion={message.question}
                    previousResults={message.sub_processes}
                    userId={message.conversationId}
                  />
                </div>
            </div>
          </div>
        </>
      )}
    {/* <div className="flex items-center justify-center">
      <div className="my-3 w-11/12 border-[.5px]"></div>
    </div> */}
    </div>
  );
};

interface IRenderConversation {
  messages: Message[];
  documents: SecDocument[];
  setUserMessage: (str: string) => void;
}

export const RenderConversations: React.FC<IRenderConversation> = ({
  messages,
  documents,
  setUserMessage,
}) => {
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lastElementRef.current) {
      lastElementRef.current.scrollIntoView();
    }
  }, [messages]);

  const showLoading = messages[messages.length - 1]?.role === ROLE.USER;
  return (
    <div className="box-border flex h-full flex-col justify-start font-nunito text-sm text-[#2B3175]">
      {messages.map((message, index) => {
        let display;
        if (message.role == ROLE.ASSISTANT) {
          display = (
            <AssistantDisplay
              message={message}
              key={`${message.id}-answer-${index}`}
              documents={documents}
            />
          );
        } else if (message.role == ROLE.USER) {
          display = (
            <UserDisplay
              message={message}
              key={`${message.id}-question-${index}-user`}
              showLoading={index === messages.length - 1 ? showLoading : false}
            />
          );
        } else {
          display = <div>Sorry, there is a problem.</div>;
        }
        if (index === messages.length - 1) {
          return (
            <div className="mb-4 flex flex-col" key={`message-${message.id}`}>
              {display}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col" key={`${message.id}-${index}`}>
              {display}
            </div>
          );
        }
      })}
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center ">
          <div className="flex w-full flex-col items-center justify-center">
            <div>
              <HiOutlineChatAlt2 size={40} />
            </div>
            <div className="mb-2 w-3/4 text-center text-lg font-bold">
              Ask JingleBell any questions !
            </div>
            <div className="m-auto flex w-full flex-wrap justify-center">
              <button
                onClick={() =>
                  setUserMessage("What must be confirmed at the end of the survey to ensure the quality of the test results?")
                }
                className="m-1 flex-shrink rounded-full border border-gray-60 px-3 py-1 hover:bg-gray-15"
              >
                What must be confirmed at the end of the survey to ensure the quality of the test results
              </button>
              <button
                onClick={() => setUserMessage("What must be confirmed at the end of the survey to ensure the quality of the test results")}
                className="m-1 flex-shrink rounded-full border border-gray-60 px-3 py-1 hover:bg-gray-15"
              >
                What must be confirmed at the end of the survey to ensure the quality of the test results?
              </button>
              <button
                onClick={() =>
                  setUserMessage("What must be confirmed at the end of the survey to ensure the quality of the test results?")
                }
                className="m-1 flex-shrink rounded-full border border-gray-60 px-3 py-1 hover:bg-gray-15"
              >
                What must be confirmed at the end of the survey to ensure the quality of the test results
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={lastElementRef}></div>
    </div>
  );
};
