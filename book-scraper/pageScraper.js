const scraperObject = {
    url : 'http://books.toscrape.com',
    async scraper(browser, category){
        let page = await browser.newPage();
        console.log(`Navigation to ${this.url}...`);
        // Navigate to the selected page
        await page.goto(this.url); 
        // Select the category of book to be displayed
            let selectedCategory = await page.$$eval('.side_categories > ul > li > ul > li > a', (links, _category) => {
                // Search for the element that has the matching text
                links = links.map( a => a.textContent.replace(/(\r\n\t|\n|\r|\t|^\s|\s$|\B\s|\s\B)/gm, "") === _category ? a : null);
                let link = links.filter(tx => tx !== null)[0];
                return link.href;
            }, category);
            await page.goto(selectedCategory);
        let scrapedData = [];
        // Wait for the required DOM to be rendered 
        async function scrapeCurrentPage(){
            await page.waitForSelector('.page_inner');
            // Get the link to all the required books
            let urls = await page.$$eval('section ol > li', links => {
                // Make sure the book to be scraped is in stock
                links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
                // Extract the links from the data
                links = links.map(elem => elem.querySelector('h3 > a').href)
                return links;
            });
        // Loop through each of those links, open a new page instance and get the relevant data from them
            let pagePromise = (link) => new Promise(async(reslove, reject) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);
                dataObj['bookTitle'] = await newPage.$eval('.product_main > h1', text => text.textContent);
                dataObj['bookPrice'] = await newPage.$eval('.price_color', text => text.textContent);
                dataObj['noAvailable'] = await newPage.$eval('.instock.availability', text => {
                    // Strip whitespaces, tabs, newlines, and other non-alphanumeric characters
                    text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");
                    // Get the number of stock available
                    let regexp = /^.*\((.*)\).*$/i;
                    let stockAvailable = regexp.exec(text)[1].split(' ')[0];
                    return stockAvailable;
                });
                dataObj['imageUrl'] = await newPage.$eval('#product_gallery img', img => img.src);
                dataObj['bookDescription'] = await newPage.$eval('#product_description', div => div.nextSibling.nextSibling.textContent);
                dataObj['upc'] = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);

                reslove(dataObj);
                await newPage.close();
            });

            for (link in urls) {
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData)
                // console.log(currentPageData);
            }
            // When all the data on this page is done, click the next button and start the scraping of the next page.
            // You are going to check if this button exist first, so you know if there really is a next page.
            let nextButtonExist = false;
            try{
                const nextButton = await page.$eval('.next > a', a => a.textContent);
                nextButtonExist = true;

            } catch (err) {
                nextButtonExist = false;
            }
            if(nextButtonExist) {
                await page.click('.next > a');
                return scrapeCurrentPage();
            }
            await page.close();
            return scrapedData;
        }
        let data = await scrapeCurrentPage();
        console.log(data);
        return data;
    }
}
/**
 * Notice that you wrapped this code in a Promise. 
 * This is because you want to be able to wait for each action in your loop to complete. 
 * Therefore each Promise opens a new URL and won’t resolve until the program has scraped all the data on the URL,
 * and then that page instance has closed.
*/
module.exports = scraperObject;