"use client";

import {
  useLiveblocksExtension,
  useIsEditorReady,
  FloatingComposer,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Dropcursor from "@tiptap/extension-dropcursor";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DeleteModal } from "../DeleteModal";
import { ClientSideSuspense, useThreads } from "@liveblocks/react/suspense";
import Loader from "../Loader";
import { ThreadOverlay } from "../Threads";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import MathExtension from "@aarkue/tiptap-math-extension";

export function Editor({
  roomId,
  currentUserType,
}: {
  roomId: string;
  currentUserType: UserType;
}) {
  const status = useIsEditorReady();
  const liveblocks = useLiveblocksExtension();
  const [scrollPosition, setScrollPosition] = useState(
    localStorage.getItem("scrollPosition")
      ? parseInt(localStorage.getItem("scrollPosition")!)
      : 0
  );

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: "focus:outline-none editor-input h-full",
      },
    },
    extensions: [
      liveblocks,
      StarterKit.configure({
        // The Liveblocks extension comes with its own history handling
        history: false,
      }),
      Link.configure({
        defaultProtocol: "https",
        protocols: ["http", "https"],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table,
      TableHeader,
      TableRow,
      TableCell,
      Image,
      Dropcursor,
      MathExtension.configure({ evaluation: true }),
    ],
    immediatelyRender: false,
    editable: currentUserType === "editor",
  });

  const { threads } = useThreads();

  // Save scroll position on scroll
  const handleScroll = () => {
    if (editorWrapperRef.current) {
      const position = editorWrapperRef.current.scrollTop;
      setScrollPosition(position);
      localStorage.setItem("scrollPosition", position.toString());
    }
  };

  const editorWrapperRef = useRef<HTMLDivElement | null>(null);
  // Restore scroll position on mount
  useLayoutEffect(() => {
    if (status) {
      requestAnimationFrame(() => {
        if (editorWrapperRef.current) {
          editorWrapperRef.current.scrollTop = scrollPosition;
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
    <div className="editor-container size-full">
      <div className="toolbar-wrapper flex min-w-full justify-between">
        {/* <Toolbar editor={editor} /> */}
        {currentUserType === "editor" && <DeleteModal roomId={roomId} />}
      </div>
      <div
        className="editor-wrapper flex flex-col items-center justify-start"
        ref={editorWrapperRef}
      >
        {status ? (
          <div className="editor-inner lg:min-h-[1100px] relative mb-5 h-fit w-full max-w-[800px] shadow-md lg:mb-10">
            <EditorContent editor={editor} className="editor" />
          </div>
        ) : (
          <Loader />
        )}

        <FloatingToolbar editor={editor} />
        <FloatingComposer editor={editor} className="w-[350px]" />
        <ClientSideSuspense fallback={<Loader />}>
          <ThreadOverlay editor={editor} />
        </ClientSideSuspense>
      </div>
    </div>
  );
}
