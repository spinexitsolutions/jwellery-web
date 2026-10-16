export const METALS: Record<string, { label: string; color: string }> = {
  gold: { label: "Yellow gold", color: "#E9C27D" },
  rose: { label: "Rose gold", color: "#ECB59E" },
  platinum: { label: "Platinum", color: "#E4E6EA" },
};

export const GEMS: Record<string, { label: string; color: string; attenuation: string }> = {
  diamond: { label: "Diamond", color: "#ffffff", attenuation: "#ffffff" },
  emerald: { label: "Emerald", color: "#34c38f", attenuation: "#0b7a52" },
  ruby: { label: "Ruby", color: "#ff3b5c", attenuation: "#a3001f" },
  sapphire: { label: "Sapphire", color: "#4c7dff", attenuation: "#0b2a9e" },
  pink: { label: "Pink tourmaline", color: "#ff9cc2", attenuation: "#e0457f" },
};
