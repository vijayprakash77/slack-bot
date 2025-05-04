# Slack Approval Bot

A Node.js Express application that implements a Slack approval workflow. This bot enables team members to request approvals from colleagues using a slash command, with a complete notification system for both requesters and approvers.

## Features

- `/approval-test` slash command to initiate approval requests
- Interactive modal with user selection and text input
- Approval/rejection buttons for reviewers
- Automatic notifications to both parties
- Direct REST API integration with Slack

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- A Slack workspace with permissions to install apps
- A [Render.com](https://render.com) account for deployment

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd slack-approval-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment variables:**
   Create a `.env` file in the project root:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   PORT=3000
   ```

4. **Run the application:**
   ```bash
   node index.js
   ```

5. **Expose local server with ngrok:**
   ```bash
   ngrok http 3000
   ```

## Slack App Configuration

1. **Create a Slack App:**
   - Go to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name your app and select your workspace

2. **Add Bot Token Scopes:**
   - Navigate to "OAuth & Permissions"
   - Add the following scopes:
     - `commands`
     - `chat:write`
     - `users:read`
     - `im:write`
   - Install the app to your workspace
   - Copy the Bot User OAuth Token

3. **Create a Slash Command:**
   - Go to "Slash Commands"
   - Create a new command: `/approval-test`
   - Set the Request URL: `https://your-app-url.com/slack/events`
   - Add a description: "Request approval from a team member"

4. **Enable Interactivity:**
   - Go to "Interactivity & Shortcuts"
   - Enable Interactivity
   - Set the Request URL: `https://your-app-url.com/slack/events`

5. **Get the Signing Secret:**
   - Go to "Basic Information"
   - Scroll to "App Credentials" and copy the Signing Secret

## Deployment on Render.com

1. **Create a new Web Service on Render:**
   - Sign in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository or use another deployment method

2. **Configure the Web Service:**
   - **Name:** `slack-approval-bot` (or your preferred name)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
   - **Instance Type:** Free 

3. **Add Environment Variables:**
   - Add the following environment variables:
     - `SLACK_BOT_TOKEN` = Your Slack Bot User OAuth Token

4. **Deploy the Service:**
   - Click "Create Web Service"
   - Wait for the deployment to complete (monitor the logs)

5. **Update Slack App with Render URL:**
   - Copy your Render app URL (e.g., `https://slack-approval-bot.onrender.com`)
   - Update the Request URLs in your Slack App:
     - For Slash Commands: `https://slack-approval-bot.onrender.com/slack/events`
     - For Interactivity: `https://slack-approval-bot.onrender.com/slack/events`

## Usage

1. In any Slack channel, type `/approval-test`
2. A modal will open where you can:
   - Select an approver from your workspace
   - Add details about your request
3. Click "Submit" to send your request
4. The approver will receive a message with "Approve" and "Reject" buttons
5. Once the approver makes their decision, you'll receive a notification

## Troubleshooting

- **Modal not opening:** Check your bot token scopes and verify the slash command URL
- **Buttons not working:** Verify the interactivity URL and check permissions
- **"dispatch_failed" error:** Make sure your application correctly handles the view submission payload
- **Render deployment issues:** Check the deployment logs in the Render dashboard

## Maintenance

- Periodically check your Render dashboard for performance and usage statistics
- Monitor your Slack App's event logs for any errors or issues
- Update dependencies regularly to ensure security and compatibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License


