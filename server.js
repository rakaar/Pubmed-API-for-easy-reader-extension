
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.get('/', async (req, res) => {
    try {
        const pubmed_link = req.query.link;
        const data = await scrapePubmed(pubmed_link);
        res.json(data);
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

async function scrapePubmed(pubmed_link) {
    // Send a request to the website
    const response = await axios.get(pubmed_link);
    const html = response.data;
    
    // Parse the website's content
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('h1.heading-title').text().trim();
    
    // Extract authors
    const repeatedAuthors = Array.from($('.authors-list-item .full-name')).map(a => $(a).text().trim());
    const authors = [...new Set(repeatedAuthors)];
        
    // Extract abstract 
    const abstract = $('.abstract-content.selected p').text().trim();
    
    // Return the data as an object
    return {title, authors, abstract};
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
