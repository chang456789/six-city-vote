// 政黨顏色。新增政黨只要在這裡加一行；沒列到的政黨一律用「其他政黨」的色系。

type PartyStyle = { color: string; text: string; short: string };

const PARTIES: Record<string, PartyStyle> = {
  民主進步黨: { color: "#1B9431", text: "#FFFFFF", short: "民進黨" },
  民進黨: { color: "#1B9431", text: "#FFFFFF", short: "民進黨" },
  中國國民黨: { color: "#0B2A8C", text: "#FFFFFF", short: "國民黨" },
  國民黨: { color: "#0B2A8C", text: "#FFFFFF", short: "國民黨" },
  台灣民眾黨: { color: "#28C8C8", text: "#0B2A2A", short: "民眾黨" },
  民眾黨: { color: "#28C8C8", text: "#0B2A2A", short: "民眾黨" },
  時代力量: { color: "#FBBE01", text: "#1E2022", short: "時力" },
  台灣基進: { color: "#A73F24", text: "#FFFFFF", short: "基進" },
  無黨籍: { color: "#8A8D91", text: "#FFFFFF", short: "無黨籍" },
};

const OTHER: PartyStyle = { color: "#6E5A7E", text: "#FFFFFF", short: "" };

export function partyStyle(party: string): PartyStyle {
  const hit = PARTIES[party.trim()];
  if (hit) return hit;
  return { ...OTHER, short: party };
}
