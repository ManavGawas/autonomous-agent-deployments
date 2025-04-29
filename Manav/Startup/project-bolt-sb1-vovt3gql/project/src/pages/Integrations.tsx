import { useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, Copy, Check, Zap, Slack, Calendar, BookOpen } from 'lucide-react';

const Integrations = () => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopyWebhook = (id: string) => {
    const webhookUrl = `https://yourdomain.com/api/webhooks/${id}`;
    navigator.clipboard.writeText(webhookUrl);
    setCopySuccess(id);

    setTimeout(() => {
      setCopySuccess(null);
    }, 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900">Zapier Integration</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect AutoInvoice with thousands of apps using Zapier.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="flex justify-center">
            <div className="p-6 text-center max-w-xl">
              <div className="mb-4">
                <Zap className="h-12 w-12 text-amber-500 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Zapier</h3>
              <p className="text-gray-600 mb-6">
                Automate your workflow by connecting AutoInvoice to your favorite apps through Zapier.
              </p>
              <button
                onClick={() => toast('Zapier integration will be available soon', { icon: '🔄' })}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect with Zapier
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900">Webhook Endpoints</h3>
          <p className="mt-1 text-sm text-gray-500">
            Use these webhook URLs to receive updates when the status of your invoices changes.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="ml-3 text-base font-medium text-gray-900">Google Calendar</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Add payment due dates and reminders to your Google Calendar automatically.
              </p>
              <div className="mt-4">
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <input
                      type="text"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 bg-gray-50"
                      value="https://yourdomain.com/api/webhooks/calendar"
                      readOnly
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyWebhook('calendar')}
                    className="relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {copySuccess === 'calendar' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-md">
                  <Slack className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="ml-3 text-base font-medium text-gray-900">Slack</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Get notified in Slack when invoices are paid, due soon, or overdue.
              </p>
              <div className="mt-4">
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <input
                      type="text"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 bg-gray-50"
                      value="https://yourdomain.com/api/webhooks/slack"
                      readOnly
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyWebhook('slack')}
                    className="relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {copySuccess === 'slack' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Using webhooks</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To use these webhooks, copy the URL and add it to the app configuration. 
                    Your app will receive POST requests with JSON data containing details about 
                    invoice status changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;