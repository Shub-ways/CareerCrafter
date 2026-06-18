const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    await page.goto('http://localhost:5173/auth', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('careercrafter_user', JSON.stringify({ username: 'Shubham Kumar' }));
    });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded. Check if there are any errors above.');
    
    const content = await page.content();
    if (content.includes('Welcome back')) {
      console.log('SUCCESS: Dashboard text found in DOM.');
    } else {
      console.log('ERROR: Dashboard text not found in DOM.');
      console.log(content.substring(0, 500)); // Print start of HTML
    }
    
    await browser.close();
  } catch (error) {
    console.error('SCRIPT ERROR:', error);
  }
})();
