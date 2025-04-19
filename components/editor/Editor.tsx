"use client";

import Theme from "./plugins/Theme";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from "@lexical/react/LexicalAutoLinkPlugin";
import { AutoLinkNode } from "@lexical/link";
import {
  AnchoredThreads,
  FloatingComposer,
  FloatingThreads,
  liveblocksConfig,
  LiveblocksPlugin,
  useIsEditorReady,
} from "@liveblocks/react-lexical";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Loader from "../Loader";
import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import { useThreads } from "@liveblocks/react/suspense";
import Comments from "../Comments";
import { DeleteModal } from "../DeleteModal";

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.

const URL_REGEX =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

function Placeholder() {
  return (
    <div className="editor-placeholder">Enter your awesome text here...</div>
  );
}

export function Editor({
  roomId,
  currentUserType,
}: {
  roomId: string;
  currentUserType: UserType;
}) {
  const status = useIsEditorReady();
  const { threads } = useThreads();

  const [scrollPosition, setScrollPosition] = useState(
    localStorage.getItem("scrollPosition")
      ? parseInt(localStorage.getItem("scrollPosition")!)
      : 0
  );

  const initialConfig = liveblocksConfig({
    namespace: "Editor",
    nodes: [HeadingNode, LinkNode, AutoLinkNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    theme: Theme,
    editable: currentUserType === "editor",
  });

  const editorWrapperRef = useRef<HTMLDivElement | null>(null);

  const urlRegExp = new RegExp(
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
  );

  function validateUrl(url: string): boolean {
    return url === "https://" || urlRegExp.test(url);
  }

  // Save scroll position on scroll
  const handleScroll = () => {
    if (editorWrapperRef.current) {
      const position = editorWrapperRef.current.scrollTop;
      setScrollPosition(position);
      // console.log("position", position);
      localStorage.setItem("scrollPosition", position.toString());
    }
  };

  // Restore scroll position on mount
  useLayoutEffect(() => {
    if (status) {
      requestAnimationFrame(() => {
        // console.log("scrollPosition", scrollPosition);
        if (editorWrapperRef.current) {
          editorWrapperRef.current.scrollTop = scrollPosition;
          // editorWrapperRef.current.scrollTo(0, 0);
        }
      });
    }
  }, [status]);

  useEffect(() => {
    if (editorWrapperRef.current) {
      editorWrapperRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (editorWrapperRef.current) {
        editorWrapperRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container size-full">
        <div className="toolbar-wrapper flex min-w-full justify-between">
          <ToolbarPlugin />
          {currentUserType === "editor" && <DeleteModal roomId={roomId} />}
        </div>

        <div
          ref={editorWrapperRef}
          className="editor-wrapper flex flex-col items-center justify-start"
        >
          {status ? (
            <div className="editor-inner lg:min-h-[1100px] relative mb-5 h-fit w-full max-w-[800px] shadow-md lg:mb-10">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    spellCheck={true}
                    lang="fr,en"
                    className="editor-input h-full"
                  />
                }
                placeholder={<Placeholder />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              {currentUserType === "editor" && <FloatingToolbarPlugin />}
              <HistoryPlugin />
              <AutoFocusPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <AutoLinkPlugin matchers={MATCHERS} />
              <ClickableLinkPlugin />
              <ListPlugin />
            </div>
          ) : (
            <Loader />
          )}

          <LiveblocksPlugin>
            <FloatingComposer className="w-[350px]" />
            <FloatingThreads
              threads={threads}
              className="w-[350px] block md:hidden"
            />
            <AnchoredThreads
              threads={threads}
              className="w-[350px] hidden sm:block"
            />
            <Comments />
          </LiveblocksPlugin>
        </div>
      </div>
    </LexicalComposer>
  );
}
