
interface ScrapeEventsParams {
  siteUrl: string;
  inputValue: string;
  city: string;
}

interface ScrapeEventsResponse {
  results: unknown[];
}

export const scrapeEvents = async (
  eventType: "Tickets" | "Other",
  params: ScrapeEventsParams
): Promise<ScrapeEventsResponse> => {
  const apiPaths: { [key: string]: string } = {
    "Tickets": "/api/scrape-tickets",
    "Other": "/api/scrape-other"
  };

  const response = await fetch(apiPaths[eventType], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`Failed to scrape events: ${response.statusText}`);
  }

  return response.json();
};
