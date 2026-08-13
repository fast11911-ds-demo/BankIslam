// Vercel serverless function — handles POST /api/start-onboarding
//
// Holds the Docusign OAuth JWT Grant credentials server-side, exchanges them
// for an access token, then triggers the Workflow Builder workflow. Never
// expose the access token or private key to the browser.
//
// Required environment variables (set in Vercel project settings):
//   DOCUSIGN_AUTH_SERVER      e.g. account-d.docusign.com (demo) or account.docusign.com (prod)
//   DOCUSIGN_INTEGRATION_KEY  Integration key (client ID) of the Docusign app
//   DOCUSIGN_USER_ID          Docusign user GUID to impersonate
//   DOCUSIGN_PRIVATE_KEY      RSA private key (PEM) for the integration key, JWT-enabled
//   DOCUSIGN_ACCOUNT_ID       Docusign account ID the workflow lives in
//   DOCUSIGN_BASE_PATH        e.g. workflows-d.docusign.com (demo) or workflows.docusign.com (prod)
//   DOCUSIGN_WORKFLOW_ID      Workflow Builder workflow ID to trigger

const jwt = require('jsonwebtoken');

async function getAccessToken() {
  const assertion = jwt.sign(
    {
      scope: 'signature impersonation',
      aud: process.env.DOCUSIGN_AUTH_SERVER,
    },
    process.env.DOCUSIGN_PRIVATE_KEY,
    {
      algorithm: 'RS256',
      issuer: process.env.DOCUSIGN_INTEGRATION_KEY,
      subject: process.env.DOCUSIGN_USER_ID,
      audience: process.env.DOCUSIGN_AUTH_SERVER,
      expiresIn: '1h',
    }
  );

  const res = await fetch(`https://${process.env.DOCUSIGN_AUTH_SERVER}/oauth/token`, {
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const workflowId = process.env.DOCUSIGN_WORKFLOW_ID;

    const triggerRes = await fetch(
      `https://${process.env.DOCUSIGN_BASE_PATH}/v1/workflows/${workflowId}/trigger`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Account-Id': process.env.DOCUSIGN_ACCOUNT_ID,
        },
        body: JSON.stringify(req.body || {}),
      }
    );

    const triggerData = await triggerRes.json();

    if (!triggerRes.ok) {
      res.status(triggerRes.status).json({ error: 'Workflow trigger failed', details: triggerData });
      return;
    }

    res.status(200).json(triggerData);
  } catch (err) {
    console.error('Failed to start onboarding workflow:', err);
    res.status(500).json({ error: 'Internal error starting onboarding workflow' });
  }
};
