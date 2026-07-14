/** Strings for the site chrome: brand mark, primary nav, and SiteNav's GitHub link. */
export const nav = {
  brand: "Form Builder",
  links: {
    builder: "Builder",
    examples: "Examples",
    docs: "Docs",
  },
  githubLabel: "GitHub repository (opens in a new tab)",
  search: {
    /** Visible label on the nav trigger (hidden on mobile, icon-only there). */
    triggerLabel: "Search",
    /** Accessible name for the trigger — covers the icon-only mobile state. */
    triggerAriaLabel: "Search docs",
    /** Decorative keyboard hint on the trigger (aria-hidden). */
    shortcutHint: "⌘K",
    /** Command-palette dialog title/description (screen-reader only). */
    dialogTitle: "Search docs",
    dialogDescription: "Search docs pages, sections, and field types.",
    placeholder: "Search docs…",
    noResults: "No results found",
    groups: {
      pages: "Pages",
      fieldTypes: "Field types",
      sections: "Sections",
    },
  },
} as const;
