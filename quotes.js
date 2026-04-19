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

  // === Eastern Wisdom ===
  { text: "A journey of a thousand miles begins with a single step.", source: "Lao Tzu" },
  { text: "Knowing others is intelligence; knowing yourself is true wisdom.", source: "Lao Tzu" },
  { text: "The man who moves a mountain begins by carrying away small stones.", source: "Confucius" },
  { text: "It does not matter how slowly you go as long as you do not stop.", source: "Confucius" },
  { text: "The mind is everything. What you think you become.", source: "Buddha" },
  { text: "Your work is to discover your work and then with all your heart to give yourself to it.", source: "Buddha" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", source: "Rumi" },
  { text: "Fall seven times, stand up eight.", source: "Japanese Proverb" },

  // === Stoic & Ancient ===
  { text: "We suffer more often in imagination than in reality.", source: "Seneca" },
  { text: "No man is free who is not master of himself.", source: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", source: "Epictetus" },
  { text: "How long are you going to wait before you demand the best of yourself?", source: "Epictetus" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", source: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", source: "Marcus Aurelius" },
  { text: "He who has a why to live for can bear almost any how.", source: "Friedrich Nietzsche" },

  // === Writers & Artists ===
  { text: "You can't wait for inspiration. You have to go after it with a club.", source: "Jack London" },
  { text: "The only way out is through.", source: "Robert Frost" },
  { text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", source: "Stephen King" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", source: "Mark Twain" },
  { text: "I love deadlines. I love the whooshing noise they make as they go by.", source: "Douglas Adams" },
  { text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", source: "Louis L'Amour" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", source: "Theodore Roosevelt" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", source: "Dale Carnegie" },

  // === Scientists & Inventors ===
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", source: "Thomas Edison" },
  { text: "Nothing in life is to be feared, it is only to be understood.", source: "Marie Curie" },
  { text: "If I have seen further, it is by standing on the shoulders of giants.", source: "Isaac Newton" },
  { text: "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.", source: "Stephen Hawking" },
  { text: "A man who dares to waste one hour of time has not discovered the value of life.", source: "Charles Darwin" },

  // === Leaders & Activists ===
  { text: "The future depends on what you do today.", source: "Mahatma Gandhi" },
  { text: "It always seems impossible until it's done.", source: "Nelson Mandela" },
  { text: "Courage is not the absence of fear, but the triumph over it.", source: "Nelson Mandela" },
  { text: "Do what you can, with what you have, where you are.", source: "Theodore Roosevelt" },
  { text: "If you're going through hell, keep going.", source: "Winston Churchill" },
  { text: "Continuous effort — not strength or intelligence — is the key to unlocking our potential.", source: "Winston Churchill" },
  { text: "The time is always right to do what is right.", source: "Martin Luther King Jr." },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", source: "Franklin D. Roosevelt" },

  // === Athletes & Coaches ===
  { text: "You miss 100% of the shots you don't take.", source: "Wayne Gretzky" },
  { text: "I've failed over and over and over again in my life. And that is why I succeed.", source: "Michael Jordan" },
  { text: "It's not whether you get knocked down; it's whether you get up.", source: "Vince Lombardi" },
  { text: "Champions keep playing until they get it right.", source: "Billie Jean King" },
  { text: "Don't count the days; make the days count.", source: "Muhammad Ali" },

  // === Modern Voices ===
  { text: "The way to get started is to quit talking and begin doing.", source: "Walt Disney" },
  { text: "Quality is never an accident. It is always the result of intelligent effort.", source: "John Ruskin" },
  { text: "Your time is limited, so don't waste it living someone else's life.", source: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", source: "Sam Levenson" },
  { text: "A year from now you will wish you had started today.", source: "Karen Lamb" },

  // === Humorous ===
  { text: "The best time to plant a tree was 20 years ago. The second best time is to stop scrolling.", source: "Internet Proverb" },
  { text: "You can't have a million-dollar dream with a minimum-wage work ethic — or a maximum-scroll habit.", source: "Unknown" },
  { text: "Your future self is watching you right now through memories. Make them proud.", source: "Unknown" },
  { text: "I have not failed. I've just found 10,000 websites that don't help me get work done.", source: "Loosely adapted from Edison" },
  { text: "Tomorrow is often the busiest day of the week.", source: "Spanish Proverb" },
  { text: "Procrastination is the art of keeping up with yesterday.", source: "Don Marquis" },
  { text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", source: "Thomas Edison" },
  { text: "Never put off till tomorrow what may be done day after tomorrow just as well.", source: "Mark Twain" },
  { text: "The problem with doing nothing is that you never know when you're finished.", source: "Leslie Nielsen" },
  { text: "Hard work never killed anybody, but why take a chance?", source: "Edgar Bergen" },
  { text: "If it weren't for the last minute, nothing would get done.", source: "Unknown" },
  { text: "I'm not lazy. I'm on energy-saving mode.", source: "Unknown" },
  { text: "I don't need time; I need a deadline.", source: "Duke Ellington" },
  { text: "I always arrive late at the office, but I make up for it by leaving early.", source: "Charles Lamb" },
  { text: "The early bird gets the worm, but the second mouse gets the cheese.", source: "Steven Wright" },
  { text: "Work expands so as to fill the time available for its completion.", source: "Parkinson's Law" },
  { text: "Writing is easy. All you have to do is stare at a blank page until drops of blood form on your forehead.", source: "Gene Fowler" },
  { text: "I can resist everything except temptation.", source: "Oscar Wilde" }
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
