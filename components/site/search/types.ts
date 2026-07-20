export type SearchGroup = "page" | "fieldType" | "heading";

export type SearchEntry = {
  id: string;
  title: string;
  href: string;
  group: SearchGroup;
  excerpt?: string;
  keywords?: string;
};
