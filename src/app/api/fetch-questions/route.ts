import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
    const { url } = await req.json();

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const questions: any[] = [];

        // Example scraping rule (adjust per website)
        $('.question').each((_, el) => {
            const questionText = $(el).text().trim();
            const options = $(el).find('li, .option, input[type=radio]').map((_, opt) => $(opt).text().trim()).get();
            const answer = $(el).find('.answer, .correct').text().trim();

            if (questionText && options.length > 0) {
                questions.push({ questionText, options, answer });
            }
        });

        return Response.json({ success: true, questions });
    } catch (err: any) {
        console.error('Scrape error:', err.message);
        return Response.json({ success: false, error: 'Failed to parse or fetch the link.' }, { status: 500 });
    }
}
