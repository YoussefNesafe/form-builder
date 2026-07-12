import type { FormConfig } from "@/form-builder";

/**
 * Single-step showcase of the newer field types: masked input, date + time
 * pairs with sibling-bound ordering, rating, segmented, slider, signature,
 * and file.
 */
export const advancedFieldsConfig: FormConfig = {
  id: "advanced-fields",
  title: "Advanced fields",
  fields: [
    { type: "masked", name: "cardNumber", label: "Card number", mask: "#### #### #### ####" },
    { type: "date", name: "startDate", label: "Start date", required: true, width: "half" },
    {
      type: "date",
      name: "endDate",
      label: "End date",
      required: true,
      minDateField: "startDate",
      width: "half",
    },
    { type: "time", name: "startTime", label: "Start time", required: true, width: "half" },
    {
      type: "time",
      name: "endTime",
      label: "End time",
      required: true,
      minTimeField: "startTime",
      width: "half",
    },
    { type: "rating", name: "satisfaction", label: "Satisfaction", max: 5 },
    {
      type: "segmented",
      name: "size",
      label: "T-shirt size",
      options: [
        { label: "S", value: "s" },
        { label: "M", value: "m" },
        { label: "L", value: "l" },
      ],
    },
    { type: "slider", name: "volume", label: "Volume", min: 0, max: 100, step: 5 },
    { type: "signature", name: "signature", label: "Signature", heightPx: 160 },
    { type: "file", name: "attachment", label: "Attachment", accept: ".pdf,.png,.jpg", maxSizeMB: 5 },
    { type: "submit", name: "submit", text: "Submit" },
  ],
};
