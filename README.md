# [Pull Approve](https://pullapprove.com) automation script

[![Greenkeeper badge](https://badges.greenkeeper.io/adrianjost/pullapprove-automation.svg)](https://greenkeeper.io/)


I am only working from Monday to Wednesday, therefore I wan't to have my away status set accordingly so I am not getting assigned to pull requests.

## How it works

The Script uses Puppeteer to automate the following steps:

1. Login to Github
    - Read Git Credentials from enviroment variables (`GIT_USERNAME`, `GIT_PASSWORD` and optional `GIT_2FA_SECRET`)
2. Set the new unavailability until date, if there isn't already an away status set.
3. Sign Out to keep the github session log clear

Those are getting executed with a [travis-ci](https://travis-ci.com) cron job that runs on a daily base. ([How-To](https://docs.travis-ci.com/user/cron-jobs/))

## You wan't this too?

Simply fork this repo and adjust the export value of the date.js file. Then you need to set your credentials on travis-ci.

ENV-Variable | example | Where to get
--- | --- | ---
`GIT_USERNAME` | `octocat` | The last section of the url when viewing your profile (`https://github.com/octocat` => `octocat`)
`GIT_PASSWORD` | `octocatSecret123` | You know it ;)
`GIT_2FA_SECRET` | `abcdef123abcdef1` | If you have set up 2FA with an Authentication App, you need to get the url behind the QR Code you get presented. It is formated like `otpauth://totp/GitHub:octocat?secret=abcdef123abcdef1&issuer=GitHub`. The query parameter `secret` is the interesting one.