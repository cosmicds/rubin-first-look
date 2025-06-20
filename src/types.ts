import { Folder } from "@wwtelescope/engine";

export interface FolderViewProps {
  rootFolder: Folder;
  flexDirection: "row" | "column";
  gap?: string;
  backgroundColor?: string;
  highlightColor?: string;
  textColor?: string;
}
