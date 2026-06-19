const prompts: Record<string, string[]> = {
  Music: ["What is one song you never skip?", "Which artist is your current obsession?"],
  Gaming: ["Which game could you play forever?", "Are you competitive or casual?"],
  Coding: ["What app would you build if money was not a problem?", "Frontend or backend?"],
  Anime: ["What anime would you recommend instantly?", "Sub or dub?"],
  Movies: ["What movie changed your taste?", "What genre do you never get bored of?"]
};

const generic = ["What is one thing people instantly notice about you?", "What is your green flag?"];

export function icebreakerFor(interest: string): string {
  const list = prompts[interest] ?? generic;
  return list[Math.floor(Math.random() * list.length)] ?? generic[0];
}
