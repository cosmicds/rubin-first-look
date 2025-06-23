import { Folder } from "@wwtelescope/engine";

export interface FolderViewProps {
  rootFolder: Folder;
  flexDirection: "row" | "column";
  gap?: string;
  backgroundColor?: string;
  thumbnailColor?: string;
  highlightColor?: string;
  textColor?: string;
  startExpanded?: boolean;
}

export type ItemSelectionType = "click" | "dblclick" | "keyup" | "folder";
