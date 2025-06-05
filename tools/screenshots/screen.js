const puppeteer = require("puppeteer");
const ora = require("ora");
const mkdirp = require("mkdirp");
const {rmDir} = require("./helper");
const spinner = new ora();
const FOLDER_OUTPUT = "./tools/screenshots/output/";
const FOLDER_NAME = "emails";
const SCREEN_PATH = `./tools/screenshots/output/${FOLDER_NAME}/`;
const SERVER_PATH = "http://localhost:3000/";
const INNER_PAGES = ["dist/unbranded/1/"];
const VIEWPORT_WIDTH = 600;
const VIEWPORT_HEIGHT = 768;
const VIEWPORT_OPTS = {
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  deviceScaleFactor: 2,
  hasTouch: true,
};

let viewportOpts = VIEWPORT_OPTS;
rmDir(FOLDER_OUTPUT + FOLDER_NAME); // clean folder with screens

mkdirp(FOLDER_OUTPUT);
mkdirp(FOLDER_OUTPUT + FOLDER_NAME);
mkdirp(FOLDER_OUTPUT + FOLDER_NAME + "/unbranded-1");


(async () => {
  // const browser = await puppeteer.launch({ devtools: false });
  const browser = await puppeteer.launch({
    devtools: false,
    headless: true,
    args: ["--no-sandbox"],
    ignoreHTPPSErrors: true,
  });
  const page = await browser.newPage();

  /** Run spinner and execute recived Function */
  async function makeScreen(msg, func) {
    spinner.start(`Start - ${msg}`);
    await func();
    spinner.succeed(`Finish - ${msg}`);
  }

  async function screenshot(name, clip) {

    let unbranded1 = name.includes("dist-unbranded-1");
    if (unbranded1) {
      var subfolder = "unbranded-1/";
    }

    let opts = {
      path: SCREEN_PATH + subfolder + name + ".png"
    };

    if (clip) {
      opts.clip = clip;
    }

    await page.screenshot(opts);
  }

  /**
   * Reset viewport height
   */
  async function resetVH() {
    viewportOpts.height = VIEWPORT_HEIGHT;
    await page.setViewport(viewportOpts);
  }

  /**
   * Screenshot DOM element
   */
  async function screenshotDOMElement(
    selector,
    name = "00_00_00",
    padding = 0
  ) {
    const rect = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      const {
        x,
        y,
        width,
        height
      } = element.getBoundingClientRect();
      return {
        left: x,
        top: y,
        width,
        height,
        id: element.id
      };
    }, selector);

    return await page.screenshot({
      path: `${SCREEN_PATH}${name}.png`,
      clip: {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      },
    });
  }

  /** Set base viewport */
  await page.setViewport(viewportOpts);
  await page.goto(`${SERVER_PATH}?screentest=true`, {
    waitUntil: "networkidle2",
  });
  await page.waitFor(3000 * 4);
  await makeScreen("Desktop Screens", DesktopEmailScreen);
  await makeScreen("Mobile Screens", mobileEmailScreen);


  /**
   * Screen For Desktop
   */
  async function DesktopEmailScreen() {
    await page.waitFor(1000);
    var k = 0;
    var screenshottype = "single"; // single OR multiple
    for (let j = 0; j < INNER_PAGES.length; j++) {
      await page.goto(SERVER_PATH + INNER_PAGES[j], {
        waitUntil: 'networkidle2'
      });
      await page.waitFor(3000);
      if (j == 0) {
        var screenshottype = "single"; // single OR multiple
        var halfnode = 1;
        var totalnode = 2;
      }
      if (screenshottype == "multiple") {
        for (let i = 0; i < 2; i++) {
          const containerHeight_1 = await page.evaluate((no, halfnode, totalnode, bannerno) => {
            if (no == 0) {
              for (let n = 0; n < halfnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "table";
                document.getElementsByClassName("outernode")[n].style.width = "100%";
              }
              for (let n = halfnode; n < totalnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "none";
              }
              if (bannerno == 0) {
                return document.getElementsByTagName("body")[0].scrollHeight;
              }

              if (bannerno == 1) {
                return document.getElementsByTagName("body")[0].scrollHeight + 20;
              }
            }
            if (no == 1) {
              for (let n = 0; n < halfnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "none";
              }
              for (let n = halfnode; n < totalnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "table";
                document.getElementsByClassName("outernode")[n].style.width = "100%";                                                                   
              }
              if (bannerno == 5) {
                return document.getElementsByTagName("body")[0].scrollHeight + 20;
              }else{
                return document.getElementsByTagName("body")[0].scrollHeight;
              }
            }
          }, i, halfnode, totalnode, j);
          viewportOpts.height = containerHeight_1;
          console.log(INNER_PAGES[j])
          viewportOpts.width = 600;
          await page.setViewport(viewportOpts);
          await page.waitFor(1000);
          let name = INNER_PAGES[j].replace(/\//g, "-");
          await screenshot(k + "-01-" + name + "-0" + i + "-Page-desktop");
        }
      } else {
        const containerHeight_1 = await page.evaluate(() => {
          return document.getElementsByTagName("body")[0].scrollHeight;
        });
        viewportOpts.height = containerHeight_1;
        viewportOpts.width = 600;
        await page.setViewport(viewportOpts);
        await page.waitFor(1000);
        let name = INNER_PAGES[j].replace(/\//g, "-");
        await screenshot(k + "-01-" + name + "-01-Page-desktop");
      }
      k++;
    }
    await resetVH();
  }
  /**
   * Screen Home
   */
  async function mobileEmailScreen() {
    await page.waitFor(1000);
    var k = 0;
    var screenshottype = "single"; // single OR multiple
    for (let j = 0; j < INNER_PAGES.length; j++) {
      await page.goto(SERVER_PATH + INNER_PAGES[j], {
        waitUntil: 'networkidle2'
      });
      await page.waitFor(1000);
      if (j == 0) {
        var screenshottype = "single"; // single OR multiple
        var halfnode = 1;
        var totalnode = 2;
      }
      if (screenshottype == "multiple") {
        for (let i = 0; i < 2; i++) {
          const containerHeight_1 = await page.evaluate((no, halfnode, totalnode, bannerno) => {
            if (no == 0) {
              for (let n = 0; n < halfnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "table";
                document.getElementsByClassName("outernode")[n].style.width = "100%";
              }
              for (let n = halfnode; n < totalnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "none";
              }

              if (bannerno == 0) {
                return document.getElementsByTagName("body")[0].scrollHeight + 220;
              }

              if (bannerno == 1) {
                return document.getElementsByTagName("body")[0].scrollHeight + 20;
              }
            }
            if (no == 1) {
              for (let n = 0; n < halfnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "none";
              }
              for (let n = halfnode; n < totalnode; n++) {
                document.getElementsByClassName("outernode")[n].style.display = "table";
                document.getElementsByClassName("outernode")[n].style.width = "100%";
              }
              if (bannerno == 0) {
                return document.getElementsByTagName("body")[0].scrollHeight;
              }

              if (bannerno == 1) {
                return document.getElementsByTagName("body")[0].scrollHeight;
              }
            }
          }, i, halfnode, totalnode, j);
          viewportOpts.height = containerHeight_1;
          viewportOpts.width = 375;
          await page.setViewport(viewportOpts);
          await page.waitFor(1000);
          let name = INNER_PAGES[j].replace(/\//g, "-");
          await screenshot(k + "-02-" + name + "-0" + i + "-Page-mobile");
        }
      }
      viewportOpts.width = 375;
      const containerHeight_1 = await page.evaluate(() => {
        return document.getElementsByTagName("body")[0].scrollHeight + 410; //for single
        // return document.getElementsByTagName("body")[0].scrollHeight; //for multiple
      });
      viewportOpts.height = containerHeight_1;
      await page.setViewport(viewportOpts);
      await page.waitFor(1000);
      let name = INNER_PAGES[j].replace(/\//g, "-");
      await screenshot(k + "-02-" + name + "-01-Page-mobile");
      k++;
    }
    await resetVH();
  }

  await browser.close();
})();
