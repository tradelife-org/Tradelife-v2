import { XeroClient } from 'xero-node'

export const xeroClient = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID || '',
  clientSecret: process.env.XERO_CLIENT_SECRET || '',
  redirectUris: [`${process.env.NEXT_PUBLIC_SITE_URL}/api/xero/callback`],
  scopes: 'openid profile email accounting.transactions.read accounting.contacts.read'.split(' '),
})
