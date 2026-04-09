// Focus Tools — Quotes Bank
// Random motivational quotes shown on the blocked page.

const QUOTES = [
  // === Pirkei Avot (Ethics of the Fathers) ===
  { text: "It is not your duty to finish the work, but neither are you free to neglect it.", source: "Pirkei Avot 2:16" },
  { text: "Who is wise? One who learns from every person.", source: "Pirkei Avot 4:1" },
  { text: "If not now, when?", source: "Hillel, Pirkei Avot 1:14" },
  { text: "The day is short, the work is great, the workers are lazy, the reward is much, and the Master is pressing.", source: "Pirkei Avot 2:15" },
  { text: "In a place where there are no men, strive to be a man.", source: "Hillel, Pirkei Avot 2:5" },
  { text: "Do not say 'When I have free time I will study,' for perhaps you will never have free time.", source: "Hillel, Pirkei Avot 2:4" },
  { text: "Who is strong? One who conquers his inclinations.", source: "Pirkei Avot 4:1" },
  { text: "Know before whom you toil, and your employer is faithful to pay you the reward of your labor.", source: "Pirkei Avot 2:14" },
  { text: "Reflect upon three things and you will not come to sin: know from where you came, where you are going, and before whom you will give an accounting.", source: "Pirkei Avot 3:1" },
  { text: "Say little and do much.", source: "Shammai, Pirkei Avot 1:15" },

  // === Tanakh / Old Testament ===
  { text: "Whatever your hand finds to do, do it with all your might.", source: "Ecclesiastes 9:10" },
  { text: "The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.", source: "Proverbs 21:5" },
  { text: "Commit your work to the Lord, and your plans will be established.", source: "Proverbs 16:3" },
  { text: "A sluggard does not plow in season; so at harvest time he looks but finds nothing.", source: "Proverbs 20:4" },
  { text: "The hand of the diligent will rule, while the slothful will be put to forced labor.", source: "Proverbs 12:24" },
  { text: "Go to the ant, you sluggard; consider its ways and be wise!", source: "Proverbs 6:6" },
  { text: "The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding.", source: "Proverbs 4:7" },
  { text: "For everything there is a season, and a time for every matter under heaven.", source: "Ecclesiastes 3:1" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", source: "Joshua 1:9" },

  // === Talmud & Mishnah ===
  { text: "We do not rely on miracles.", source: "Talmud, Pesachim 64b" },
  { text: "Every blade of grass has its angel that bends over it and whispers, 'Grow, grow.'", source: "Talmud, Berakhot 6b" },
  { text: "If you have learned much Torah, do not take credit for yourself, because that is what you were created to do.", source: "Talmud, Avot 2:8" },
  { text: "Whoever destroys a single life is considered as if he destroyed an entire world; whoever saves a single life is considered as if he saved an entire world.", source: "Mishnah Sanhedrin 4:5" },

  // === Jewish & Israeli Thinkers ===
  { text: "If you will it, it is no dream.", source: "Theodor Herzl" },
  { text: "The whole world is a very narrow bridge, and the main thing is not to be afraid at all.", source: "Rabbi Nachman of Breslov" },
  { text: "Teach your tongue to say 'I do not know,' lest you be led to falsehood.", source: "Rambam (Maimonides)" },
  { text: "In Israel, in order to be a realist you must believe in miracles.", source: "David Ben-Gurion" },
  { text: "Anyone who has never made a mistake has never tried anything new.", source: "Albert Einstein" },
  { text: "The measure of intelligence is the ability to change.", source: "Albert Einstein" },
  { text: "Strive not to be a success, but rather to be of value.", source: "Albert Einstein" },
  { text: "The secret of getting ahead is getting started.", source: "Golda Meir" },
  { text: "Make your work a matter of principle and your distraction a matter of chance.", source: "Rabbi Yisrael Salanter" },

  // === Other Thinkers & Philosophers ===
  { text: "The successful warrior is the average man, with laser-like focus.", source: "Bruce Lee" },
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", source: "Seneca" },
  { text: "You could leave life right now. Let that determine what you do and say and think.", source: "Marcus Aurelius" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", source: "Alexander Graham Bell" },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", source: "Stephen Covey" },
  { text: "Discipline equals freedom.", source: "Jocko Willink" },
  { text: "What we fear doing most is usually what we most need to do.", source: "Tim Ferriss" },
  { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", source: "Winston Churchill" },
  { text: "Action is the foundational key to all success.", source: "Pablo Picasso" },
  { text: "The only way to do great work is to love what you do.", source: "Steve Jobs" },
  { text: "Focus is not about saying yes. It is about saying no.", source: "Steve Jobs" },
  { text: "A person who chases two rabbits catches neither.", source: "Confucius" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", source: "Aristotle" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", source: "Cal Newport" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", source: "James Clear" },

  // === Humorous ===
  { text: "The best time to plant a tree was 20 years ago. The second best time is to stop scrolling.", source: "Internet Proverb" },
  { text: "You can't have a million-dollar dream with a minimum-wage work ethic — or a maximum-scroll habit.", source: "Unknown" },
  { text: "Your future self is watching you right now through memories. Make them proud.", source: "Unknown" },
  { text: "I have not failed. I've just found 10,000 websites that don't help me get work done.", source: "Loosely adapted from Edison" }
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// Auto-initialize on blocked.html
document.addEventListener("DOMContentLoaded", () => {
  const textEl = document.getElementById("quoteText");
  const sourceEl = document.getElementById("quoteSource");
  if (textEl && sourceEl) {
    const q = getRandomQuote();
    textEl.textContent = "\u201C" + q.text + "\u201D";
    sourceEl.textContent = "\u2014 " + q.source;
  }
});
