export type ExportKind = "type" | "function" | "constant" | "class";

export interface FoodMapSettings {
  roleFolders: Record<string, ExportKind>;
  nestFileKinds: string[];
  sharedFolder: string;
  sharedChildFolders: string[];
  infraFolders: Record<string, string[]>;
}

export function getFoodMapSettings(settings: Readonly<Record<string, unknown>>) {
  const foodMapSettings = settings["food-map"];
  if (!foodMapSettings) {
    throw new Error('.oxlintrc.json 의 settings["food-map"] 가 없다.');
  }
  return foodMapSettings as FoodMapSettings;
}

export function createNestFilePattern({ nestFileKinds }: FoodMapSettings) {
  return new RegExp(`\\.(${nestFileKinds.join("|")})\\.ts$`);
}
