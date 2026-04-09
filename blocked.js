const q = getRandomQuote();
document.getElementById("quoteText").textContent = "\u201C" + q.text + "\u201D";
document.getElementById("quoteSource").textContent = "\u2014 " + q.source;
