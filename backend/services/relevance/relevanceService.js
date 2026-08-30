/**
 * Simple keyword-based relevance detection
 * Can be replaced by an AI model later.
 */
const determineRelevance = (newText, monitor) => {
  // Always relevant if no description or identifier is provided, and content changed
  if (!monitor.description && !monitor.identifier) {
    return { relevant: true, reason: 'Content changed (no specific criteria provided).' };
  }

  const textLower = newText.toLowerCase();
  
  // We no longer strictly require the identifier to be in the HTML.
  // IPO websites don't print PAN numbers in the raw HTML; users have to submit forms.
  // The identifier is just stored to show the user in Telegram later.

  // We are removing strict keyword matching because users often write conversational 
  // descriptions (e.g. "notify me when results are released") which do not appear 
  // in the actual HTML of the website. If the content changed, it's relevant!
  return { relevant: true, reason: 'Content changed.' };
};

module.exports = {
  determineRelevance
};
