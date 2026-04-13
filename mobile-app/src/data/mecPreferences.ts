/**
 * Shared WHO MEC preference labels/descriptions for Guest and OB flows.
 * Keep keys stable because scoring logic depends on these internal keys.
 */

export interface MecPreferenceOption {
  key: string;
  label: string;
  description: string;
}

export const MEC_PREFERENCE_LABELS: Record<string, string> = {
  regular: "Regular Menstruation",
  effectiveness: "Very Effective",
  longterm: "Long-Lasting",
  privacy: "Private to Use",
  client: "Self-Controlled",
  nonhormonal: "Hormone-Free",
  sti: "STI Protection",
};

export const MEC_PREFERENCE_OPTIONS: MecPreferenceOption[] = [
  {
    key: "effectiveness",
    label: MEC_PREFERENCE_LABELS.effectiveness,
    description: "Strong pregnancy prevention when used correctly",
  },
  {
    key: "nonhormonal",
    label: MEC_PREFERENCE_LABELS.nonhormonal,
    description: "Does not contain hormones",
  },
  {
    key: "regular",
    label: MEC_PREFERENCE_LABELS.regular,
    description: "Helps make periods more regular and may reduce cramps",
  },
  {
    key: "privacy",
    label: MEC_PREFERENCE_LABELS.privacy,
    description: "Can be used discreetly without others knowing",
  },
  {
    key: "client",
    label: MEC_PREFERENCE_LABELS.client,
    description: "You can start or stop it yourself",
  },
  {
    key: "longterm",
    label: MEC_PREFERENCE_LABELS.longterm,
    description: "Works for years with little maintenance",
  },
];

export function getMecPreferenceLabel(key: string): string {
  return MEC_PREFERENCE_LABELS[key] || key;
}
