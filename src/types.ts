import { Folder } from "@wwtelescope/engine";

export interface FolderViewProps {
  rootFolder: Folder;
  flexDirection: "row" | "column";
  gap?: string;
  backgroundColor?: string;
  highlightColor?: string;
  textColor?: string;
}

export type ItemSelectionType = "click" | "dblclick" | "keyup" | "folder";
