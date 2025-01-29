"use server"

import puppeteer from "puppeteer";

export async function POST(request: Request) {
    try {
        const { siteUrl, inputValue, city } = await request.json();
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();

        await page.goto(siteUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('#keyword-bar-in-search', { timeout: 60000 });
        await page.type('#keyword-bar-in-search', inputValue);

        await page.waitForSelector('#location-typeahead-header-search', { visible: true, timeout: 60000 });
        await page.type('#location-typeahead-header-search', city);

        await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 60000 });

        const button = await page.$('button[type="submit"]');
        if (button) {
            await button.evaluate(b => b.scrollIntoView());
            await button.click();
        } else {
            throw new Error('Submit button not found');
        }

        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

        const results = await page.evaluate(() => {
            const events = document.querySelectorAll('div.sc-fyofxi-0.MDVIb');
            return Array.from(events).map(event => {
                const name = event.querySelector('span.sc-fyofxi-5.gJmuwa')?.textContent || null;
                const city = event.querySelector('span.sc-fyofxi-7.jWLmQR span.sc-fyofxi-5.gJmuwa:nth-child(1)')?.textContent || null;
                const place = event.querySelector('span.sc-fyofxi-7.jWLmQR span.sc-fyofxi-5.gJmuwa:nth-child(2)')?.textContent || null;
                const link = event.querySelector('a.sc-1qeub3n-4')?.getAttribute('href') || null;
                const date = event.querySelector('span.VisuallyHidden-sc-8buqks-0 span')?.textContent || null;
                const time = event.querySelector('span.sc-1idcr5x-1.dieHWG span')?.textContent || null;

                return { name, city, place, link, date, time };
            });
        });

        await browser.close();

        return new Response(JSON.stringify({ results }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}