require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Initialize Express app
 const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// extract body from request before send to respective handler
app.use(bodyParser.json());

app.get('/api/bot', (req, res) => {
     console.log(process.env.SLACK_BOT_TOKEN);
    res.json({ message: 'Hello from Slack Approval Bot!' });
   
})

app.post('/slack/events', (req, res) => {
  const payload = req.body;
  
  // Handle different types of payloads
 if (payload.command === '/approval-test') {
    // Handle slash command
    handleSlashCommand(payload, res);
  } else if (payload.type === 'block_actions') {
    // Handle interactive button clicks
    handleInteractiveActions(JSON.parse(payload.payload), res);
  } else if (payload.type === 'view_submission') {
    // Handle modal submission
    handleViewSubmission(JSON.parse(payload.payload), res);
  } else {
    // Unknown event type
    return res.status(404).send('Event type not supported');
  }
});

// Function to handle the /approval-test slash command
const handleSlashCommand = (payload, res) => {
  // Acknowledge the command request
  res.status(200).send();
  
  // Open a modal for the user
  const modal = {
    trigger_id: payload.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'approval_modal',
      title: {
        type: 'plain_text',
        text: 'Request Approval'
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Please select an approver and enter your request:'
          }
        },
        {
          type: 'input',
          block_id: 'approver_block',
          element: {
            type: 'users_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select an approver'
            },
            action_id: 'approver_select'
          },
          label: {
            type: 'plain_text',
            text: 'Approver'
          }
        },
        {
          type: 'input',
          block_id: 'approval_text_block',
          element: {
            type: 'plain_text_input',
            multiline: true,
            action_id: 'approval_text_input',
            placeholder: {
              type: 'plain_text',
              text: 'Enter details about your request...'
            }
          },
          label: {
            type: 'plain_text',
            text: 'Request Details'
          }
        }
      ],
      submit: {
        type: 'plain_text',
        text: 'Submit'
      }
    }
  };
  
  // Call the views.open API
  axios.post('https://slack.com/api/views.open', modal, {
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }).catch(error => {
    console.error('Error opening modal:', error.response?.data || error.message);
  });
};

// Function to handle modal submission
const handleViewSubmission = (payload, res) => {
  // Acknowledge the view submission
  res.status(200).send();
  
  const view = payload.view;
  // Extract the values from the modal
  const approver = view.state.values.approver_block.approver_select.selected_user;
  const approvalText = view.state.values.approval_text_block.approval_text_input.value;
  const requester = payload.user.id;
  
  // Send message to approver with approve/reject buttons
  const approvalMessage = {
    channel: approver,
    text: `You have a new approval request from <@${requester}>:`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New Approval Request from <@${requester}>*`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `>_${approvalText}_`
        }
      },
      {
        type: 'actions',
        block_id: 'approval_actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Approve',
              emoji: true
            },
            style: 'primary',
            value: JSON.stringify({ requester, approvalText }),
            action_id: 'approve_request'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Reject',
              emoji: true
            },
            style: 'danger',
            value: JSON.stringify({ requester, approvalText }),
            action_id: 'reject_request'
          }
        ]
      }
    ]
  };
  
  // Call the chat.postMessage API
  axios.post('https://slack.com/api/chat.postMessage', approvalMessage, {
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }).then(() => {
    // Notify requester that their request has been sent
    const requesterMessage = {
      channel: requester,
      text: `Your approval request has been sent to <@${approver}>. You'll be notified when they respond.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Your approval request has been sent to <@${approver}>. You'll be notified when they respond.`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `>_${approvalText}_`
          }
        }
      ]
    };
    
    return axios.post('https://slack.com/api/chat.postMessage', requesterMessage, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }).catch(error => {
    console.error('Error sending messages:', error.response?.data || error.message);
  });
};

// Function to handle interactive button actions
const handleInteractiveActions = (payload, res) => {
  // Acknowledge the action
  res.status(200).send();
  
  // Get the action data
  const action = payload.actions[0];
  const actionId = action.action_id;
  const messageTs = payload.message.ts;
  const channelId = payload.channel.id;
  const actionData = JSON.parse(action.value);
  const requester = actionData.requester;
  const approvalText = actionData.approvalText;
  const approver = payload.user.id;
  
  // Handle different actions
  if (actionId === 'approve_request') {
    // Update the original message to show it was approved
    const updatedMessage = {
      channel: channelId,
      ts: messageTs,
      text: `You approved a request from <@${requester}>`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Approval Request from <@${requester}>*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `>_${approvalText}_`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *You approved this request.*`
          }
        }
      ]
    };
    
    // Call the chat.update API
    axios.post('https://slack.com/api/chat.update', updatedMessage, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(() => {
      // Notify the requester of approval
      const notificationMessage = {
        channel: requester,
        text: `Your approval request has been approved by <@${approver}>!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Your approval request has been approved by <@${approver}>!*`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `>_${approvalText}_`
            }
          }
        ]
      };
      
      return axios.post('https://slack.com/api/chat.postMessage', notificationMessage, {
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }).catch(error => {
      console.error('Error handling approval:', error.response?.data || error.message);
    });
  } else if (actionId === 'reject_request') {
    // Update the original message to show it was rejected
    const updatedMessage = {
      channel: channelId,
      ts: messageTs,
      text: `You rejected a request from <@${requester}>`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Approval Request from <@${requester}>*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `>_${approvalText}_`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *You rejected this request.*`
          }
        }
      ]
    };
    
    // Call the chat.update API
    axios.post('https://slack.com/api/chat.update', updatedMessage, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(() => {
      // Notify the requester of rejection
      const notificationMessage = {
        channel: requester,
        text: `Your approval request has been rejected by <@${approver}>.`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `❌ *Your approval request has been rejected by <@${approver}>.*`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `>_${approvalText}_`
            }
          }
        ]
      };
      
      return axios.post('https://slack.com/api/chat.postMessage', notificationMessage, {
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }).catch(error => {
      console.error('Error handling rejection:', error.response?.data || error.message);
    });
  }
};

// Start the server
app.listen(port, () => {
  console.log(`⚡️ Slack Approval Bot is running on port ${port}!`);
});
