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
const GIT = {
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
console.error("Available @" + unavailableUntil);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    "https://app.pullapprove.com/accounts/github/login/?next=%2Favailability%2F"
  );

  await page.waitFor("input[name=login]", { visible: true });

  await page.type("input[name=login]", GIT.USERNAME);
  await page.type("input[name=password]", GIT.PASSWORD);

  await Promise.all([
    page.waitForNavigation(),
    page.click(
      "#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block"
    )
  ]);

  await page.waitFor("input[name=otp]", { visible: true });
  await page.type("input[name=otp]", GIT.OTP);

  await Promise.all([
    page.waitForNavigation(),
    page.click("#login > div.auth-form-body.mt-3 > form > button")
  ]);

  await page.waitFor("input[name=unavailable_until]");

  await page.evaluate(date => {
    document.getElementById("id_unavailable_until").value = date;
  }, unavailableUntil);

  await Promise.all([page.waitForNavigation(), page.click("form > button")]);

  await browser.close();
})();
