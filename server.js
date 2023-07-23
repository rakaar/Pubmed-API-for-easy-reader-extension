
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());
// Middleware for parsing bodies from URL.
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware for parsing json
app.use(bodyParser.json());


app.get('/', async (req, res) => {
    try {
        const pubmed_link = req.query.link;
        // Your code here
        const data = await scrapePubmed(pubmed_link);
        res.json(data);
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

app.post('/prescrape', async (req, res) => {
    try {
        const pubmedLinks = req.body;
        const allNcbiLinks = pubmedLinks.map(item => modifyNcbiLink(item.PubMedLink));
        const ncbi2pubmedLinks = allNcbiLinks.slice(0,Math.min(50, allNcbiLinks.length));
        
        const promises = ncbi2pubmedLinks.map(scrapePubmed);
        const results = await Promise.all(promises); 

        res.json(results)
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});


async function scrapePubmed(pubmed_link) {

    if (pubmed_link === '') {
        return {}
    }
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

function modifyNcbiLink(originalLink) {
    // function to modify ncbi link to pubmed link

    if (originalLink === '') {
        return '';
    }
    let url = new URL(originalLink);

    // Check if the hostname includes "ncbi.nlm.nih.gov"
    if (url.hostname.includes("ncbi.nlm.nih.gov")) {
        let list_uids = url.searchParams.get("list_uids");

        // Ensure list_uids param exists and is a valid number
        if (list_uids && !isNaN(list_uids)) {
            // Construct the new link
            return `https://www.pubmed.ncbi.nlm.nih.gov/${list_uids}`;
        }
    }

    // If conditions aren't met, return the original link
    return originalLink;
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
