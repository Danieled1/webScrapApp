const pageScraper = require('./pageScraper');
const fs = require('fs');
// Takes in the browser instance and passes it to scrapeAll 
// pass this instance to pageScraper.scraper as an argument which uses it to scrape pages.
async function scrapeAll(browserInstance){
    let browser;
    try {
        browser = await browserInstance;
        let scrapedData = {};
        // Call the scrapper for different set of books to be scraped
        scrapedData['Travel'] = await pageScraper.scraper(browser, 'Travel');
        scrapedData['Psychology'] = await pageScraper.scraper(browser, 'Psychology');
        scrapedData['Cultural'] = await pageScraper.scraper(browser, 'Cultural');
        scrapedData['Health'] = await pageScraper.scraper(browser, 'Health');
        await browser.close();
        fs.writeFile("data.json", JSON.stringify(scrapedData), 'utf8',(err) => {
            if(err){
                return console.log(err);
            }
            console.log("The data has been scraped and saved successfully! View it at './data.json'");   
        });
    } catch (err) {
        console.log("Could not reslove the browser instance => ", err);

    }
}

module.exports = (browserInstance) => scrapeAll(browserInstance)