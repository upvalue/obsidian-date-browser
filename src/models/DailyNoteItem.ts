import type { ParsedDate } from "../services/DateParser";
import type { GenericFile } from "../interfaces/VaultAdapter";

export interface DailyNoteItem<TFile extends GenericFile = GenericFile> {
  file: TFile;
  parsedDate: ParsedDate;
  displayDate: string;
}
