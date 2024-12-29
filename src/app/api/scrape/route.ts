// import { NextApiRequest, NextApiResponse } from "next";
// import { JSDOM } from 'jsdom';

// export async function POST(req: NextApiRequest, res: NextApiResponse) {
//     try {
//         console.log('Request received:', req.body);

//         const response = await fetch('https://www.npmjs.com/package/puppeteer');
//         const html = await response.text();

//         const dom = new JSDOM(html);
//         const document = dom.window.document;

//         const downloads = document.querySelector('_9ba9a726')?.textContent;

//         console.log('downloads', downloads);

//         return res.status(200).json({ downloads });
//     } catch (error) {
//         console.error('Unexpected error:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// }

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'POST') {
//         return POST(req, res);
//     } else {
//         res.setHeader('Allow', ['POST']);
//         res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
// }