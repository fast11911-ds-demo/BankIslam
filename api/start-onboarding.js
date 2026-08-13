// Vercel serverless function — handles POST /api/start-onboarding
//
// Holds the Docusign OAuth JWT Grant credentials server-side, exchanges them
// for an access token, then triggers the Workflow Builder workflow. Never
// expose the access token or private key to the browser.
//
// Required environment variables (already set in Vercel project settings):
//   DOCUSIGN_INTEGRATION_KEY  Integration key (client ID) of the Docusign app
//   DOCUSIGN_USER_ID          Docusign user GUID to impersonate
//   DOCUSIGN_PRIVATE_KEY      RSA private key (PEM) for the integration key, JWT-enabled
//   DOCUSIGN_ACCOUNT_ID       Docusign account ID the workflow lives in
//   DOCUSIGN_WORKFLOW_ID      Workflow Builder workflow ID to trigger
//   DOCUSIGN_USER_EMAIL       Email of the impersonated user (used for workflowBuilder/workflowPreparer inputs)
//
// Auth/API hosts are the demo/developer environment. Change both constants
// below to account.docusign.com / api.docusign.com for production.

const jwt = require('jsonwebtoken');

const AUTH_HOST = 'account-d.docusign.com';
const API_HOST = 'api-d.docusign.com';

async function getAccessToken() {
  const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const assertion = jwt.sign(
    { scope: 'signature impersonation aow_manage' },
    privateKey,
    {
      algorithm: 'RS256',
      issuer: process.env.DOCUSIGN_INTEGRATION_KEY,
      subject: process.env.DOCUSIGN_USER_ID,
      audience: AUTH_HOST,
      expiresIn: '1h',
    }
  );

  const res = await fetch(`https://${AUTH_HOST}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Docusign token request failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function triggerWorkflow(accessToken) {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const workflowId = process.env.DOCUSIGN_WORKFLOW_ID;

  // Verified via GetWorkflowTriggerRequirements — this is the real contract
  // for this workflow: POST /v1/accounts/{accountId}/workflows/{workflowId}/actions/trigger
  const url = `https://${API_HOST}/v1/accounts/${accountId}/workflows/${workflowId}/actions/trigger`;

  const body = {
    instance_name: `Retail Onboarding - ${new Date().toISOString()}`,
    trigger_inputs: {
      startDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      workflowBuilder: process.env.DOCUSIGN_USER_EMAIL || '',
      workflowPreparer: process.env.DOCUSIGN_USER_EMAIL || '',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Trigger workflow failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data; // { id, workflow_instance_url, ... }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const result = await triggerWorkflow(accessToken);
    res.status(200).json(result);
  } catch (err) {
    console.error('Failed to start onboarding workflow:', err);
    res.status(500).json({ error: 'Internal error starting onboarding workflow' });
  }
};
