require("dotenv").config();
const puppeteer = require("puppeteer");

const twoFactor = require("node-2fa");

if (
  !process.env.GIT_USERNAME ||
  !process.env.GIT_PASSWORD ||
  !process.env.GIT_2FA_SECRET
) {
  console.error("GIT CREDENTIALS MISSING");
  process.exit(1);
}

process.env.GIT_2FA_SECRET.token;
const GIT_DATA = {
  USERNAME: process.env.GIT_USERNAME,
  PASSWORD: process.env.GIT_PASSWORD,
  get OTP() {
    return twoFactor.generateToken(process.env.GIT_2FA_SECRET).token;
  }
};

const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");
dayjs.extend(weekday);

// before Thursday
const NOW = dayjs(new Date());
if (NOW.day() < 3 || (NOW.day() === 3 && NOW.hour() > 14)) {
  exit(0);
}

const unavailableUntil = dayjs(new Date())
  .weekday(8)
  .set("hour", 7)
  .set("minute", 0)
  .format("YYYY-MM-DD HH:mm");

const gitLogin = async (page, credentials) => {
  console.log("git login...");

  await page.waitFor("input[name=login]", { visible: true });

  await page.type("input[name=login]", credentials.USERNAME);
  await page.type("input[name=password]", credentials.PASSWORD);

  await Promise.all([
    page.waitForNavigation(),
    page.click(
      "#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block"
    )
  ]);

  await page.waitFor("input[name=otp]", { visible: true });
  await page.type("input[name=otp]", credentials.OTP);

  await Promise.all([
    page.waitForNavigation(),
    page.click("#login > div.auth-form-body.mt-3 > form > button")
  ]);

  console.log("logged in");
};

const gitLogout = async (page) => {
  console.log("git logout");
  await page.goto("http://github.com/logout");
  await Promise.all([page.waitForNavigation(), page.click("input[value='Sign out']")]);
  console.log("logged out");
}

const pageIncludesText = async (page, text) =>
  page.evaluate(
    find => document.querySelector("body").innerText.includes(find),
    text
  );

(async () => {
  const browser = await puppeteer.launch({headless: process.env.HEADLESS_CHROME !== "false" });
  const page = await browser.newPage();

  // open Login page
  await page.goto(
    "https://app.pullapprove.com/accounts/github/login/?next=%2Favailability%2F"
  );

  // logging in
  await gitLogin(page, GIT_DATA);

  await page.waitFor("input[name=unavailable_until]");

  // do we need to update the date?
  const isUnavailable = await pageIncludesText(page, "You are unavailable until");
  if (isUnavailable) {
    console.log("Unavailability already set, do not override.");
    await gitLogout(page);
    process.exit(0);
  }

  await page.evaluate(date => {
    document.getElementById("id_unavailable_until").value = date;
  }, unavailableUntil);
  await Promise.all([page.waitForNavigation(), page.click("form > button")]);

  console.log(`new unavailability set (${unavailableUntil})`);

  await gitLogout(page);

  await browser.close();
  process.exit(0);
})();
