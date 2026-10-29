// The AI toolkit for engineering managers: the newsletter signup incentive.
// /toolkit shows the first FREE prompts in full and the rest as locked cards.
// /toolkit/all (unlisted, noindex) shows all of them; it's linked from the /confirmed page,
// where beehiiv sends people after they confirm their subscription.
//
// Each prompt: group (badge), title, use (one line), prompt (lines; [brackets] are highlighted),
// guards (the → lines at the end of the prompt), watch (the "watch out for" notes).

export const FREE = 2;

export const GROUPS = {
  weekly: { label: "Every week", color: "#B7D26C" },
  review: { label: "Review season", color: "#BB99F6" },
  hiring: { label: "Hiring", color: "#84D2CE" },
};

export const PROMPTS = [
  {
    group: "weekly",
    title: "Feedback Synthesis",
    use: "Turn raw data about a report into structured, specific feedback, without starting from a blank page.",
    prompt: [
      "You're helping me prepare feedback for [name].",
      "Here's what I have: [notes / PRs / tickets, 2 min to grab]",
      "",
      "Give me:",
      "1. Up to two specific strengths, tied to an example",
      "2. One growth area, framed as a behaviour",
      "3. One open question for the 1:1",
    ],
    guards: ["Don't invent anything I didn't give you.", "Tell me what's missing instead of guessing."],
    watch: [
      "The model will invent a plausible strength if the input is thin. Check the output against what you actually know before you use it.",
      "Growth areas tend to come out softened. If it feels vague, ask it to be more specific about the behaviour, not the trait.",
    ],
  },
  {
    group: "weekly",
    title: "Team Pulse Digest",
    use: "Triage attention across your whole team before a busy week, without reading every update one by one.",
    prompt: [
      "You're helping me triage attention across my team this week.",
      "Here's what I have: [standups / tickets / check-ins per person]",
      "",
      "Give me:",
      "1. One line per person: what's actually going on",
      "2. A flag: green / yellow / red, and why",
      "3. A ranked list: who I talk to first, and why",
    ],
    guards: ["Don't manufacture differences that aren't there.", "Don't infer a mood from a commit log.", "If I gave you nothing for someone, say \"no data\" and leave them out of the ranking."],
    watch: [
      "Models will confidently read a mood into thin data: a quiet week, a few late commits. Check flags against what you actually know.",
      "The ranked list is a prompt for your judgment. If it feels wrong, trust yourself.",
    ],
  },
  {
    group: "review",
    title: "Performance Review Write-up",
    use: "Get from a cycle's worth of scattered notes to a first draft you can actually edit.",
    prompt: [
      "You're helping me draft a performance review for [name].",
      "Here's what I have: [1:1 notes / peer feedback / shipped work from this cycle]",
      "Our expectations for their level: [paste the rubric or career ladder]",
      "",
      "Give me:",
      "1. A short summary of the period, in plain language",
      "2. Evidence for each expectation, with gaps marked as gaps",
      "3. Two things to keep doing and one to change, each tied to an example",
    ],
    guards: ["Use only the evidence I gave you.", "Tell me if most of my examples come from the last few weeks."],
    watch: [
      "First drafts come out in HR voice. Rewrite the summary in your own words: your report will hear the difference.",
      "The rating is yours to decide. If the draft starts hinting at one, ignore it and decide from the evidence.",
    ],
  },
  {
    group: "review",
    title: "Promotion Case Builder",
    use: "Build the argument, and the answer to the strongest objection, before you're in the calibration room.",
    prompt: [
      "You're helping me build a promotion case for [name], from [current level] to [next level].",
      "Here's what I have: [their work, scope and impact over the last 6 to 12 months]",
      "What the next level expects: [paste the expectations]",
      "",
      "Give me:",
      "1. The case in three sentences",
      "2. Evidence for each expectation, strongest first, gaps marked as gaps",
      "3. The toughest objection a calibration committee will raise, and an honest answer",
    ],
    guards: ["Don't inflate scope or impact.", "If the evidence doesn't support the next level yet, say so."],
    watch: [
      "The model argues for whoever is asking. Run it a second time as the sceptical committee member and see what survives.",
      "Committees discount adjectives. Every claim in the final case needs a concrete example next to it.",
    ],
  },
  {
    group: "review",
    title: "Difficult Conversation Prep",
    use: "Structure what you need to say before a hard conversation, without turning it into a script.",
    prompt: [
      "You're helping me prepare for a hard conversation with [name] about [topic].",
      "Context: [what happened / what I've already said / what needs to change]",
      "",
      "Give me:",
      "1. The one sentence I need to say in the first two minutes",
      "2. Three reactions to expect, and what might be behind each",
      "3. What a good outcome looks like by the end of the meeting",
    ],
    guards: ["No script beyond that first sentence. Structure only, I'll find my own words.", "Point out where I'm softening the message."],
    watch: [
      "This is preparation. The conversation itself is the part that stays yours, so close the laptop before you walk in.",
      "The model doesn't know this person. Treat the expected reactions as possibilities and stay curious about the real one.",
    ],
  },
  {
    group: "hiring",
    title: "Hiring Debrief Synthesiser",
    use: "Pull a clear signal from scattered interviewer notes before the debrief turns into a negotiation.",
    prompt: [
      "You're helping me prepare a hiring debrief for [role].",
      "Here's what I have: [interviewer notes and scorecards, candidate name removed]",
      "The must-haves for this role: [list]",
      "",
      "Give me:",
      "1. For each must-have: evidence for, evidence against, not assessed",
      "2. Where interviewers disagree, and on what exactly",
      "3. Three questions the debrief needs to settle",
    ],
    guards: ["Keep observations separate from opinions.", "Don't give me a hire / no-hire verdict.", "Flag any note about something unrelated to the job (age, family, accent, looks) and leave it out of the evidence."],
    watch: [
      "\"Not assessed\" is usually the most useful column. Gaps are cheaper to fix with one more conversation than with a bad hire.",
      "Strip names and anything identifying before you paste, and check your company's policy on candidate data first.",
    ],
  },
  {
    group: "hiring",
    title: "Onboarding Plan Generator",
    use: "Build a 30/60/90-day plan for a new hire before their first day, not after.",
    prompt: [
      "You're helping me plan the first 90 days for [name], joining as [role] on [start date].",
      "Context: [the team / current projects / people they'll work with / what I need from them by month three]",
      "",
      "Give me:",
      "1. Week one, day by day, including who they should meet",
      "2. One observable milestone each for days 30, 60 and 90",
      "3. Where a new hire is most likely to get stuck, based on what I gave you",
    ],
    guards: ["Keep week one light on reading and heavy on people.", "Use roles, not names, for anyone I didn't name.", "Mark anything you assumed."],
    watch: [
      "Generated plans are always overloaded. Cut a third before you share it.",
      "Go through the plan with your new hire in week one and let them edit it. It becomes their plan, which is the point.",
    ],
  },
];
